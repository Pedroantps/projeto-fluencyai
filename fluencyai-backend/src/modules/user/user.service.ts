import type { Level } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('Usuário não encontrado.');

  const [flashcardsCount, messagesCount] = await Promise.all([
    prisma.flashcard.count({ where: { userId } }),
    prisma.message.count({ where: { userId } }),
  ]);

  // Estimativa de horas ativas: ~2 min por mensagem
  const studyHours = (messagesCount * 2) / 60;
  const streak = messagesCount > 0 ? 1 : 0;

  return {
    userId: user.id,
    stats: {
      streak: streak.toString(),
      words: flashcardsCount.toString(),
      hours: studyHours.toFixed(1),
      level: user.level,
      studyTime: user.studyTime,
    },
  };
}

export async function updatePreferences(userId: string, data: { level?: Level; studyTime?: number }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.level !== undefined && { level: data.level }),
      ...(data.studyTime !== undefined && { studyTime: data.studyTime }),
    },
  });
  return { id: user.id, name: user.name, email: user.email, level: user.level, studyTime: user.studyTime };
}
