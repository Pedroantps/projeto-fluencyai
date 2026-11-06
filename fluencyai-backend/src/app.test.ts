import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    kanbanTask: { updateMany: vi.fn(), findFirstOrThrow: vi.fn(), findMany: vi.fn() },
    flashcard: { findFirst: vi.fn(), update: vi.fn() },
    message: { create: vi.fn() },
  },
}));

vi.mock('./lib/firebase-admin', () => ({ firebaseAuth: { verifyIdToken: mocks.verifyIdToken } }));
vi.mock('./lib/prisma', () => ({ prisma: mocks.prisma, pool: {} }));
vi.mock('./lib/ai/gemini', () => ({ generateJson: vi.fn(), sanitizeForPrompt: (s: string) => s }));
vi.mock('./lib/ai/groq', () => ({ groq: {}, transcribe: vi.fn() }));
vi.mock('./lib/ai/tts', () => ({ synthesize: vi.fn(), warmupTts: vi.fn() }));

import { app } from './app';

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
