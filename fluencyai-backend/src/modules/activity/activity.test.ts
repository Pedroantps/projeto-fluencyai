import { describe, it, expect } from 'vitest';
import { computeStreak, summarizeActivity } from './activity';

const now = new Date('2026-01-10T12:00:00Z');
const d = (iso: string) => new Date(iso + 'T00:00:00Z');

describe('computeStreak', () => {
  it('sem atividade retorna 0', () => expect(computeStreak([], now)).toBe(0));
  it('só hoje retorna 1', () => expect(computeStreak([d('2026-01-10')], now)).toBe(1));
  it('hoje, ontem e anteontem retorna 3', () =>
    expect(computeStreak([d('2026-01-08'), d('2026-01-10'), d('2026-01-09')], now)).toBe(3));
  it('ontem e anteontem sem hoje ainda conta (graça até meia-noite UTC)', () =>
    expect(computeStreak([d('2026-01-09'), d('2026-01-08')], now)).toBe(2));
  it('última atividade há 2 dias zera', () => expect(computeStreak([d('2026-01-08')], now)).toBe(0));
  it('um dia de intervalo quebra a sequência', () =>
    expect(computeStreak([d('2026-01-10'), d('2026-01-09'), d('2026-01-07')], now)).toBe(2));
  it('ignora duplicatas e normaliza horários', () =>
    expect(computeStreak([new Date('2026-01-10T23:59:00Z'), d('2026-01-10'), new Date('2026-01-09T03:00:00Z')], now)).toBe(2));
});

describe('summarizeActivity', () => {
  it('soma minutos totais e de hoje e ignora linhas com 0s no streak', () => {
    const r = summarizeActivity([
      { date: d('2026-01-10'), seconds: 600 },
      { date: d('2026-01-10'), seconds: 90 },
      { date: d('2026-01-09'), seconds: 0 },
      { date: d('2026-01-08'), seconds: 1200 },
    ], now);
    expect(r).toEqual({ streak: 1, totalMinutes: 31, todayMinutes: 11 });
  });
});
