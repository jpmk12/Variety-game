// Simple 3-letter (CVC) words for early spellers. Kept clean, concrete, and
// easy to picture. Data-driven so longer/themed words are an easy add later.

export const WORDS = [
  'CAT', 'DOG', 'SUN', 'HAT', 'BED', 'PIG', 'CUP', 'BUS', 'FOX', 'HEN',
  'BAT', 'COW', 'BUG', 'CAR', 'PEN', 'NET', 'BOX', 'MAP', 'TOP', 'WEB',
  'JAM', 'LOG', 'MUD', 'RUG', 'VAN', 'ZIP', 'BEE', 'OWL', 'ANT', 'EGG',
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Choose a word, avoiding an immediate repeat.
export function pickWord(prev) {
  let w = pick(WORDS);
  while (w === prev) w = pick(WORDS);
  return w;
}

// N distractor letters that are not `target` and not in `avoid` (so a set of
// perches never shows duplicate letters).
export function distractors(target, avoid, n) {
  const taken = new Set([target, ...(avoid || [])]);
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < 500) {
    const l = pick(LETTERS);
    if (!taken.has(l)) { taken.add(l); out.push(l); }
  }
  return out;
}
