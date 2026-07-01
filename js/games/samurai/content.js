// Content for the Samurai game. Uppercase letters for now; the pool is
// data-driven, so numbers/lowercase are a one-line addition later.

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Bright, fruit-like colors for the flung letters.
export const COLORS = [
  '#ff6b6b', '#ff9f43', '#feca57', '#1dd1a1', '#54a0ff',
  '#5f27cd', '#ff6bcb', '#48dbfb', '#00d2d3', '#c8a2ff',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Choose a target letter, avoiding an immediate repeat.
export function pickTarget(prev) {
  let t = pick(LETTERS);
  while (t === prev) t = pick(LETTERS);
  return t;
}

// Build the set of letters for a wave: the target (1–2 copies) plus a few
// distractors, shuffled. Returns an array of { char, isTarget }.
export function buildWave(target, { targetCount = 1, distractors = 4 } = {}) {
  const items = [];
  for (let i = 0; i < targetCount; i++) items.push({ char: target, isTarget: true });

  const others = LETTERS.filter((l) => l !== target);
  for (let i = 0; i < distractors; i++) {
    items.push({ char: pick(others), isTarget: false });
  }

  // shuffle (Fisher–Yates) so the target isn't always first
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function colorFor(char) {
  // stable-ish color per glyph so the same letter looks consistent in a wave
  return COLORS[(char.charCodeAt(0)) % COLORS.length];
}
