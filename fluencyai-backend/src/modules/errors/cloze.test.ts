import { describe, it, expect } from 'vitest';
import { buildCloze, isIdenticalCorrection } from './cloze';

describe('buildCloze', () => {
  it('troca o trecho corrigido por ____', () =>
    expect(buildCloze('I goed to school yesterday.', 'I went to school yesterday.', 'Past of go.').front).toBe('I ____ to school yesterday.'));
  it('mantém a pontuação final do trecho trocado', () =>
    expect(buildCloze('I like very much pizza.', 'I like pizza very much.', 'x').front).toBe('I like ____.'));
  it('verso = frase corrigida + linha em branco + explicação', () =>
    expect(buildCloze('I goed home', 'I went home', 'Past of go.').back).toBe('I went home\n\nPast of go.'));
  it('diferença só de caixa/pontuação usa o fallback Corrija', () =>
    expect(buildCloze('i went home', 'I went home.', 'x').front).toBe('Corrija: "i went home"'));
  it('reescrita da frase inteira usa o fallback', () =>
    expect(buildCloze('Eu gosto de café', 'I like coffee', 'x').front).toBe('Corrija: "Eu gosto de café"'));
  it('trecho com mais de 4 palavras usa o fallback', () =>
    expect(buildCloze('Yesterday me and him goes to the the park', 'Yesterday he and I went to the park', 'x').front).toMatch(/^Corrija:/));
});

describe('isIdenticalCorrection', () => {
  it('detecta diferença só de caixa/pontuação', () => expect(isIdenticalCorrection('i went home', 'I went home.')).toBe(true));
  it('detecta lado vazio', () => expect(isIdenticalCorrection('  ', 'I went home')).toBe(true));
  it('false quando há correção real', () => expect(isIdenticalCorrection('I goed home', 'I went home')).toBe(false));
});
