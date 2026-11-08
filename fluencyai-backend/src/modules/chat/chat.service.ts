import { prisma } from '../../lib/prisma';
import { completeJson } from '../../lib/ai/groq';
import { sanitizeForPrompt } from '../../lib/ai/gemini';
import { notFound, badRequest } from '../../lib/errors';
import { buildSystemPrompt, chatReplySchema, OPENING_INSTRUCTION } from './prompt';
import { recordActivity } from '../activity/activity.service';
import { CHAT_MESSAGE_SECONDS } from '../activity/activity';

type ChatUser = { id: string; level: string };

const DEFAULT_TITLE = 'Nova conversa';

// Garante que a sessão pertence ao usuário (anti-IDOR)
async function ownedSession(userId: string, sessionId: string) {
  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw notFound('Sessao nao encontrada.');
  return session;
}

export async function listSessions(userId: string) {
  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true } } },
  });
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    topic: s.topic,
    updatedAt: s.updatedAt,
    preview: s.messages[0]?.content.slice(0, 140) ?? '',
  }));
}

export async function createSession(userId: string, title?: string) {
  const s = await prisma.chatSession.create({ data: { userId, title: title?.trim() || DEFAULT_TITLE } });
  return { id: s.id, title: s.title, topic: s.topic, updatedAt: s.updatedAt, preview: '' };
}

export async function deleteSession(userId: string, sessionId: string) {
  const { count } = await prisma.chatSession.deleteMany({ where: { id: sessionId, userId } });
  if (count === 0) throw notFound('Sessao nao encontrada.');
  return { success: true };
}

export async function getMessages(userId: string, sessionId: string) {
  await ownedSession(userId, sessionId);
  const history = await prisma.message.findMany({
    where: { sessionId, userId },
    include: { correction: true },
    orderBy: { createdAt: 'asc' },
  });
  return history.map((m) => ({
    id: m.id,
    role: m.role.toLowerCase(),
    content: m.content,
    correction: m.correction,
  }));
}

export async function sendMessage(user: ChatUser, sessionId: string, message: string) {
  const session = await ownedSession(user.id, sessionId);
  await prisma.message.create({ data: { content: message, role: 'USER', userId: user.id, sessionId } });

  // Últimas 10 mensagens da sessão (mais recentes), em ordem cronológica
  const recent = await prisma.message.findMany({
    where: { sessionId, userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  const history = recent.reverse();

  const parsed = await completeJson(
    [
      { role: 'system', content: buildSystemPrompt(user.level, session.topic ? sanitizeForPrompt(session.topic) : null) },
      ...history.map((m) => ({ role: m.role === 'USER' ? ('user' as const) : ('assistant' as const), content: m.content })),
    ],
    chatReplySchema,
  );

  const aiMessage = await prisma.message.create({
    data: {
      content: parsed.reply,
      role: 'ASSISTANT',
      userId: user.id,
      sessionId,
      ...(parsed.correction && { correction: { create: { ...parsed.correction, userId: user.id } } }),
    },
    include: { correction: true },
  });

  // Dá título à sessão pela primeira fala do aluno, se ainda estiver com o título padrão
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date(), ...(session.title === DEFAULT_TITLE && { title: message.slice(0, 60) }) },
  });

  await recordActivity(user.id, 'chat', CHAT_MESSAGE_SECONDS);

  return { reply: aiMessage.content, correction: aiMessage.correction || null };
}

// Abre (ou cria) a sessão do assunto de uma tarefa de chat do Kanban
export async function openTaskSession(user: ChatUser, taskId: string) {
  const task = await prisma.kanbanTask.findFirst({ where: { id: taskId, userId: user.id } });
  if (!task) throw notFound('Tarefa nao encontrada.');
  if (task.type !== 'chat') throw badRequest('A tarefa nao e de chat.');

  const existing =
    (await prisma.chatSession.findFirst({ where: { userId: user.id, taskId } })) ??
    (await prisma.chatSession.findFirst({ where: { userId: user.id, topic: task.title }, orderBy: { updatedAt: 'desc' } }));

  if (existing) {
    // Recoloca o vínculo se a sessão veio do fallback por assunto (tarefa recriada)
    if (existing.taskId !== taskId) {
      await prisma.chatSession.updateMany({ where: { id: existing.id, userId: user.id }, data: { taskId } }).catch(() => undefined);
    }
    return { sessionId: existing.id, created: false };
  }

  const topic = task.title;
  const opening = await completeJson(
    [
      { role: 'system', content: buildSystemPrompt(user.level, sanitizeForPrompt(topic)) },
      { role: 'user', content: OPENING_INSTRUCTION },
    ],
    chatReplySchema,
    0.5,
  );

  const session = await prisma.chatSession.create({
    data: {
      userId: user.id,
      taskId,
      topic,
      title: topic.slice(0, 60),
      messages: { create: { content: opening.reply, role: 'ASSISTANT', userId: user.id } },
    },
  });
  return { sessionId: session.id, created: true };
}
