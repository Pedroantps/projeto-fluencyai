import { addDaysUtc, startOfTodayUtc } from '../../lib/dates';

export const CHAT_MESSAGE_SECONDS = 60;
export const FLASHCARD_REVIEW_SECONDS = 20;
export const DICTATION_REVIEW_SECONDS = 40;

export function computeStreak(activeDays: Date[], now = new Date()): number {
  const days = new Set(activeDays.map((x) => startOfTodayUtc(x).getTime()));
  let cursor = startOfTodayUtc(now);
  if (!days.has(cursor.getTime())) cursor = addDaysUtc(cursor, -1);
  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak++;
    cursor = addDaysUtc(cursor, -1);
  }
  return streak;
}

export function summarizeActivity(rows: { date: Date; seconds: number }[], now = new Date()) {
  const perDay = new Map<number, number>();
  let total = 0;
  for (const row of rows) {
    const key = startOfTodayUtc(row.date).getTime();
    perDay.set(key, (perDay.get(key) ?? 0) + row.seconds);
    total += row.seconds;
  }
  const activeDays = [...perDay].filter(([, s]) => s > 0).map(([t]) => new Date(t));
  const today = perDay.get(startOfTodayUtc(now).getTime()) ?? 0;
  return {
    streak: computeStreak(activeDays, now),
    totalMinutes: Math.floor(total / 60),
    todayMinutes: Math.floor(today / 60),
  };
}
