const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

export function buildCloze(original: string, corrected: string, explanation: string): { front: string; back: string } {
  const o = original.trim().split(/\s+/).filter(Boolean);
  const c = corrected.trim().split(/\s+/).filter(Boolean);
  const on = o.map(norm);
  const cn = c.map(norm);
  const max = Math.min(c.length, o.length);

  let p = 0;
  while (p < max && on[p] === cn[p]) p++;
  let s = 0;
  while (p + s < max && on[o.length - 1 - s] === cn[c.length - 1 - s]) s++;

  const changed = c.slice(p, c.length - s);
  const originalSpan = o.length - p - s;
  let front = `Corrija: "${original}"`;
  // O trecho trocado deve ser curto em ambos os lados e não pode ser a frase inteira
  if (changed.length >= 1 && changed.length <= 4 && originalSpan <= 4 && changed.length < c.length) {
    const trailing = changed[changed.length - 1].match(/[.,!?;:]+$/)?.[0] ?? '';
    front = [...c.slice(0, p), `____${trailing}`, ...c.slice(c.length - s)].join(' ');
  }

  return { front: front.slice(0, 300), back: `${corrected}\n\n${explanation}`.slice(0, 1000) };
}
