// Content for the Samurai game. The character pool is data-driven and chosen by
// the player's "what to slash" setting (letters / numbers / both).

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const NUMBERS = '0123456789'.split('');

// Short, decodable words for Word Mode — the sensei calls one and the child
// slashes its letters in order to spell it.
export const WORDS = [
  'CAT', 'DOG', 'SUN', 'HAT', 'BUG', 'BED', 'CUP', 'FOX', 'PIG', 'BOX',
  'BAT', 'PEN', 'JAM', 'MUD', 'NET', 'BUS', 'HEN', 'LOG', 'MAP', 'RUG',
  'STAR', 'FISH', 'MOON', 'CAKE', 'FROG', 'DUCK', 'BOAT', 'TREE',
];

// Resolve the active character pool for a content mode. Word Mode uses letters
// for its flying distractors.
export function poolFor(mode) {
  if (mode === 'numbers') return NUMBERS;
  if (mode === 'both') return LETTERS.concat(NUMBERS);
  return LETTERS;
}

// Pick a word, avoiding an immediate repeat.
export function pickWord(prev) {
  let w = WORDS[Math.floor(Math.random() * WORDS.length)];
  while (w === prev && WORDS.length > 1) w = WORDS[Math.floor(Math.random() * WORDS.length)];
  return w;
}

// Is this glyph a digit? (used to say "number" vs "letter")
export function isNumber(ch) {
  return ch >= '0' && ch <= '9';
}

// Bright, fruit-like colors for the flung letters.
export const COLORS = [
  '#ff6b6b', '#ff9f43', '#feca57', '#1dd1a1', '#54a0ff',
  '#5f27cd', '#ff6bcb', '#48dbfb', '#00d2d3', '#c8a2ff',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Choose a target from the given pool, avoiding an immediate repeat.
export function pickTarget(prev, pool = LETTERS) {
  let t = pick(pool);
  while (t === prev && pool.length > 1) t = pick(pool);
  return t;
}

// Build the set of glyphs for a wave: the target (1–2 copies) plus a few
// distractors from the pool, shuffled. Returns an array of { char, isTarget }.
export function buildWave(target, pool = LETTERS, { targetCount = 1, distractors = 4 } = {}) {
  const items = [];
  for (let i = 0; i < targetCount; i++) items.push({ char: target, isTarget: true });

  const others = pool.filter((l) => l !== target);
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
