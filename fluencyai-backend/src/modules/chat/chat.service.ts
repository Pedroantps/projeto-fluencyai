import { prisma } from '../../lib/prisma';
import { completeJson } from '../../lib/ai/groq';
import { buildSystemPrompt, chatReplySchema } from './prompt';
import { recordActivity } from '../activity/activity.service';
import { CHAT_MESSAGE_SECONDS } from '../activity/activity';

const last24h = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

export async function sendMessage(user: { id: string; level: string }, message: string) {
  await prisma.message.create({ data: { content: message, role: 'USER', userId: user.id } });

  // Últimas 10 mensagens das últimas 24h (mais recentes), em ordem cronológica
  const recent = await prisma.message.findMany({
    where: { userId: user.id, createdAt: { gte: last24h() } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  const history = recent.reverse();

  const parsed = await completeJson(
    [
      { role: 'system', content: buildSystemPrompt(user.level) },
      ...history.map((m) => ({ role: m.role === 'USER' ? ('user' as const) : ('assistant' as const), content: m.content })),
    ],
    chatReplySchema,
  );

  const aiMessage = await prisma.message.create({
    data: {
      content: parsed.reply,
      role: 'ASSISTANT',
      userId: user.id,
      ...(parsed.correction && { correction: { create: { ...parsed.correction, userId: user.id } } }),
    },
    include: { correction: true },
  });

  await recordActivity(user.id, 'chat', CHAT_MESSAGE_SECONDS);

  return { reply: aiMessage.content, correction: aiMessage.correction || null };
}

export async function getHistory(userId: string) {
  const history = await prisma.message.findMany({
    where: { userId, createdAt: { gte: last24h() } },
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

export async function clearHistory(userId: string) {
  await prisma.message.deleteMany({ where: { userId } });
  return { success: true };
}
