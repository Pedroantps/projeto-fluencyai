export type Quality = 0 | 1 | 2; // 0 = errei, 1 = bom, 2 = fácil

export interface SrsState { interval: number; easeFactor: number }

// Função pura: calcula o novo estado e a próxima data de revisão
export function review(card: SrsState, quality: Quality, now = new Date()) {
  let { interval, easeFactor } = card;

  if (quality === 0) {
    interval = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (quality === 1) {
    interval = interval === 0 ? 1 : Math.round(interval * easeFactor);
  } else {
    interval = interval === 0 ? 4 : Math.round(interval * easeFactor * 1.3);
    easeFactor += 0.15;
  }

  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + (interval === 0 ? 1 : interval));

  return { interval, easeFactor, nextReviewDate };
}
