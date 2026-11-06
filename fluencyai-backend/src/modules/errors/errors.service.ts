import { prisma } from '../../lib/prisma';
import { ERROR_CATEGORIES } from '../../lib/enums';
import { buildCloze } from './cloze';

export async function listErrors(userId: string) {
  const rows = await prisma.correction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: { id: true, original: true, corrected: true, explanation: true, category: true, createdAt: true, flashcardCreated: true },
  });

  const items = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  const groups = ERROR_CATEGORIES.map((category) => {
    const inGroup = items.filter((i) => i.category === category);
    return { category, count: inGroup.length, items: inGroup };
  })
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count); // sort estável: empates mantêm a ordem do enum

  return { total: items.length, pending: items.filter((i) => !i.flashcardCreated).length, groups };
}

export async function createClozeCards(userId: string, ids?: string[]): Promise<{ count: number }> {
  const rows = await prisma.correction.findMany({
    where: { userId, flashcardCreated: false, ...(ids && { id: { in: ids } }) },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  if (rows.length === 0) return { count: 0 };

  await prisma.$transaction([
    prisma.flashcard.createMany({
      data: rows.map((r) => ({ ...buildCloze(r.original, r.corrected, r.explanation), source: 'erro' as const, userId })),
    }),
    prisma.correction.updateMany({
      where: { id: { in: rows.map((r) => r.id) }, userId },
      data: { flashcardCreated: true },
    }),
  ]);
  return { count: rows.length };
}
