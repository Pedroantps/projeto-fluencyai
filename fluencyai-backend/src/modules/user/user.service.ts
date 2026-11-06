import type { Level } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { getActivityStats } from '../activity/activity.service';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('Usuário não encontrado.');

  const [flashcardsCount, { streak, totalMinutes, todayMinutes }] = await Promise.all([
    prisma.flashcard.count({ where: { userId } }),
    getActivityStats(userId),
  ]);

  return {
    userId: user.id,
    stats: {
      streak: String(streak),
      words: flashcardsCount.toString(),
      hours: (totalMinutes / 60).toFixed(1),
      studyMinutes: totalMinutes,
      todayMinutes,
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
