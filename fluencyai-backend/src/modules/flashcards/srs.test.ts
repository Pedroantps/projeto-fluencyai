import { describe, it, expect } from 'vitest';
import { review } from './srs';

const now = new Date('2026-01-10T12:00:00Z');

describe('review (SRS)', () => {
  it('quality 0 zera o intervalo, reduz o ease (mín. 1.3) e agenda para amanhã', () => {
    const r = review({ interval: 10, easeFactor: 1.4 }, 0, now);
    expect(r.interval).toBe(0);
    expect(r.easeFactor).toBe(1.3);
    expect(r.nextReviewDate.getDate()).toBe(11);
  });

  it('quality 1 no primeiro acerto usa 1 dia; depois multiplica pelo ease', () => {
    expect(review({ interval: 0, easeFactor: 2.5 }, 1, now).interval).toBe(1);
    expect(review({ interval: 4, easeFactor: 2.5 }, 1, now).interval).toBe(10);
  });

  it('quality 2 no primeiro acerto usa 4 dias e aumenta o ease', () => {
    const r = review({ interval: 0, easeFactor: 2.5 }, 2, now);
    expect(r.interval).toBe(4);
    expect(r.easeFactor).toBeCloseTo(2.65);
  });
});
