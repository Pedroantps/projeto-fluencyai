import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, chatReplySchema, LEVEL_GUIDE } from './prompt';
import { ERROR_CATEGORIES } from '../../lib/enums';

describe('prompt do chat', () => {
  it('inclui a orientação do nível do aluno', () => {
    expect(buildSystemPrompt('A1')).toContain('CEFR level A1');
    expect(buildSystemPrompt('A1')).toContain(LEVEL_GUIDE.A1);
    expect(buildSystemPrompt('C2')).toContain(LEVEL_GUIDE.C2);
  });
  it('nível desconhecido cai para B1', () => expect(buildSystemPrompt('Z9')).toContain('CEFR level B1'));
  it('lista todas as categorias de erro no formato JSON', () => {
    for (const c of ERROR_CATEGORIES) expect(buildSystemPrompt('B1')).toContain(c);
  });
  it('categoria fora do enum vira other', () => {
    const r = chatReplySchema.parse({ reply: 'Hi', correction: { original: 'a', corrected: 'b', explanation: 'c', category: 'banana' } });
    expect(r.correction?.category).toBe('other');
  });
  it('correção ausente é aceita', () => expect(chatReplySchema.parse({ reply: 'Hi', correction: null }).correction).toBeNull());
});
