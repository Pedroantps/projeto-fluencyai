import type { ActivityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { startOfTodayUtc } from '../../lib/dates';
import { summarizeActivity } from './activity';

export async function recordActivity(userId: string, type: ActivityType, seconds: number, now = new Date()): Promise<void> {
  if (seconds <= 0) return;
  try {
    const date = startOfTodayUtc(now);
    await prisma.studyActivity.upsert({
      where: { userId_date_type: { userId, date, type } },
      create: { userId, date, type, seconds },
      update: { seconds: { increment: seconds } },
    });
  } catch (err) {
    logger.warn({ err }, 'Falha ao registrar atividade');
  }
}

export async function getActivityStats(userId: string, now = new Date()) {
  const rows = await prisma.studyActivity.findMany({ where: { userId }, select: { date: true, seconds: true } });
  return summarizeActivity(rows, now);
}
