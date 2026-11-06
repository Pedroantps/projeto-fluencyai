import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  completeJson: vi.fn(),
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    kanbanTask: { findFirst: vi.fn(), updateMany: vi.fn(), findFirstOrThrow: vi.fn(), findMany: vi.fn() },
    flashcard: { findFirst: vi.fn(), update: vi.fn(), count: vi.fn() },
    studyActivity: { upsert: vi.fn(), findMany: vi.fn() },
    message: { create: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock('./lib/firebase-admin', () => ({ firebaseAuth: { verifyIdToken: mocks.verifyIdToken } }));
vi.mock('./lib/prisma', () => ({ prisma: mocks.prisma, pool: {} }));
vi.mock('./lib/ai/gemini', () => ({ generateJson: vi.fn(), sanitizeForPrompt: (s: string) => s }));
vi.mock('./lib/ai/groq', () => ({ groq: {}, transcribe: vi.fn(), completeJson: mocks.completeJson }));
vi.mock('./lib/ai/tts', () => ({ synthesize: vi.fn(), warmupTts: vi.fn() }));

import { app } from './app';
import { startOfTodayUtc, addDaysUtc } from './lib/dates';

const dbUser = { id: 'u1', firebaseUid: 'fb1', email: 'a@a.com', name: 'A', level: 'B1', studyTime: 30 };
const UUID = '11111111-1111-4111-8111-111111111111';
const auth = { Authorization: 'Bearer good-token' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyIdToken.mockResolvedValue({ uid: 'fb1', email: 'a@a.com' });
  mocks.prisma.user.findUnique.mockResolvedValue(dbUser);
});

describe('autenticação', () => {
  it('rejeita requisição sem token com 401', async () => {
    const res = await request(app).get('/api/schedule');
    expect(res.status).toBe(401);
  });

  it('rejeita token inválido com 401', async () => {
    mocks.verifyIdToken.mockRejectedValue(new Error('bad'));
    const res = await request(app).get('/api/flashcards/due').set(auth);
    expect(res.status).toBe(401);
  });

  it('ignora o email enviado pelo cliente: usa só o usuário do token', async () => {
    mocks.prisma.kanbanTask.findMany.mockResolvedValue([{ id: 't' }]);
    await request(app).get('/api/schedule?email=victim@x.com').set(auth);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({ where: { firebaseUid: 'fb1' } });
  });
});

describe('autorização (IDOR)', () => {
  it('PATCH em tarefa de outro usuário retorna 404', async () => {
    mocks.prisma.kanbanTask.updateMany.mockResolvedValue({ count: 0 });
    const res = await request(app).patch(`/api/schedule/task/${UUID}`).set(auth).send({ completed: true });
    expect(res.status).toBe(404);
    expect(mocks.prisma.kanbanTask.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: UUID, userId: 'u1' } }),
    );
  });

  it('review de flashcard de outro usuário retorna 404', async () => {
    mocks.prisma.flashcard.findFirst.mockResolvedValue(null);
    const res = await request(app).patch(`/api/flashcards/${UUID}/review`).set(auth).send({ quality: 1 });
    expect(res.status).toBe(404);
    expect(mocks.prisma.flashcard.findFirst).toHaveBeenCalledWith({ where: { id: UUID, userId: 'u1' } });
  });
});

describe('validação de entrada', () => {
  it('chat com mensagem gigante retorna 400', async () => {
    const res = await request(app).post('/api/chat').set(auth).send({ message: 'x'.repeat(2001) });
    expect(res.status).toBe(400);
  });

  it('quality fora do intervalo retorna 400', async () => {
    const res = await request(app).patch(`/api/flashcards/${UUID}/review`).set(auth).send({ quality: 9 });
    expect(res.status).toBe(400);
  });

  it('id que não é uuid retorna 400', async () => {
    const res = await request(app).patch('/api/schedule/task/abc').set(auth).send({ completed: true });
    expect(res.status).toBe(400);
  });

  it('nível inválido nas preferências retorna 400', async () => {
    const res = await request(app).patch('/api/user/preferences').set(auth).send({ level: 'Z9' });
    expect(res.status).toBe(400);
  });

  it('tts com texto longo demais retorna 400', async () => {
    const res = await request(app).post('/api/tts').set(auth).send({ text: 'a'.repeat(1001) });
    expect(res.status).toBe(400);
  });

  it('upload que não é áudio retorna 400', async () => {
    const res = await request(app)
      .post('/api/transcribe')
      .set(auth)
      .attach('audio', Buffer.from('MZ'), { filename: 'a.exe', contentType: 'application/x-msdownload' });
    expect(res.status).toBe(400);
  });
});

describe('cabeçalhos e CORS', () => {
  it('health é público e envia headers do helmet', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('não libera CORS para origem desconhecida', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('progresso real', () => {
  it('GET /me calcula streak e minutos a partir de StudyActivity do próprio usuário', async () => {
    const today = startOfTodayUtc();
    mocks.prisma.flashcard.count.mockResolvedValue(5);
    mocks.prisma.studyActivity.findMany.mockResolvedValue([
      { date: today, seconds: 120 }, { date: addDaysUtc(today, -1), seconds: 1380 },
    ]);
    const res = await request(app).get('/api/me').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.stats).toMatchObject({ streak: '2', words: '5', studyMinutes: 25, todayMinutes: 2, hours: '0.4' });
    expect(mocks.prisma.studyActivity.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }));
  });

  it('review em modo ditado registra atividade dictation de 40s', async () => {
    mocks.prisma.flashcard.findFirst.mockResolvedValue({ id: UUID, interval: 0, easeFactor: 2.5 });
    mocks.prisma.flashcard.update.mockResolvedValue({ id: UUID });
    const res = await request(app).patch(`/api/flashcards/${UUID}/review`).set(auth).send({ quality: 1, mode: 'dictation' });
    expect(res.status).toBe(200);
    expect(mocks.prisma.studyActivity.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_date_type: expect.objectContaining({ userId: 'u1', type: 'dictation' }) },
      update: { seconds: { increment: 40 } },
    }));
  });

  it('modo de review inválido retorna 400', async () => {
    const res = await request(app).patch(`/api/flashcards/${UUID}/review`).set(auth).send({ quality: 1, mode: 'x' });
    expect(res.status).toBe(400);
  });

  it('concluir tarefa de vídeo pendente credita duration*60 segundos', async () => {
    mocks.prisma.kanbanTask.findFirst.mockResolvedValue({ completed: false, type: 'video', duration: 15 });
    mocks.prisma.kanbanTask.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.kanbanTask.findFirstOrThrow.mockResolvedValue({ id: UUID });
    await request(app).patch(`/api/schedule/task/${UUID}`).set(auth).send({ completed: true });
    expect(mocks.prisma.kanbanTask.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: UUID, userId: 'u1' } }));
    expect(mocks.prisma.studyActivity.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { seconds: { increment: 900 } } }));
  });

  it('falha ao registrar atividade não quebra a revisão', async () => {
    mocks.prisma.flashcard.findFirst.mockResolvedValue({ id: UUID, interval: 0, easeFactor: 2.5 });
    mocks.prisma.flashcard.update.mockResolvedValue({ id: UUID });
    mocks.prisma.studyActivity.upsert.mockRejectedValueOnce(new Error('db down'));
    const res = await request(app).patch(`/api/flashcards/${UUID}/review`).set(auth).send({ quality: 2 });
    expect(res.status).toBe(200);
    expect(mocks.prisma.studyActivity.upsert).toHaveBeenCalled();
  });

  it.each([
    ['tarefa não-vídeo pendente', { completed: false, type: 'reading', duration: 15 }],
    ['vídeo já concluído', { completed: true, type: 'video', duration: 15 }],
  ])('concluir %s não registra atividade', async (_n, task) => {
    mocks.prisma.kanbanTask.findFirst.mockResolvedValue(task);
    mocks.prisma.kanbanTask.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.kanbanTask.findFirstOrThrow.mockResolvedValue({ id: UUID });
    const res = await request(app).patch(`/api/schedule/task/${UUID}`).set(auth).send({ completed: true });
    expect(res.status).toBe(200);
    expect(mocks.prisma.studyActivity.upsert).not.toHaveBeenCalled();
  });
});

describe('chat adaptado ao nível', () => {
  it('chat usa o nível do aluno no prompt e salva a correção com userId e categoria', async () => {
    mocks.prisma.message.findMany.mockResolvedValue([]);
    mocks.completeJson.mockResolvedValue({ reply: 'Nice!', correction: { original: 'I goed', corrected: 'I went', explanation: 'Past of go.', category: 'verb_tense' } });
    mocks.prisma.message.create.mockResolvedValueOnce({}).mockResolvedValueOnce({ content: 'Nice!', correction: { category: 'verb_tense' } });
    const res = await request(app).post('/api/chat').set(auth).send({ message: 'I goed home' });
    expect(res.status).toBe(200);
    expect(mocks.completeJson.mock.calls[0][0][0].content).toContain('CEFR level B1');
    expect(mocks.prisma.message.create).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ correction: { create: expect.objectContaining({ userId: 'u1', category: 'verb_tense' }) } }),
    }));
  });
});
