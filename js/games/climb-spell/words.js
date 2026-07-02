// Words for Climb & Spell, grouped into three "worlds" of growing length so the
// game becomes a little journey: Backyard (3 letters) → City Rooftops (4) →
// Night Sky (5). Kept concrete and easy to picture. Data-driven so more worlds
// or words are an easy add later.

export const WORLDS = [
  {
    id: 'backyard', name: 'Backyard', emoji: '🌳', len: 3,
    words: [
      'CAT', 'DOG', 'SUN', 'HAT', 'BED', 'PIG', 'CUP', 'BUS', 'FOX', 'HEN',
      'BAT', 'COW', 'BUG', 'CAR', 'PEN', 'NET', 'BOX', 'MAP', 'TOP', 'WEB',
      'JAM', 'LOG', 'MUD', 'RUG', 'VAN', 'BEE', 'OWL', 'ANT', 'EGG', 'FAN',
    ],
  },
  {
    id: 'rooftops', name: 'City Rooftops', emoji: '🏙️', len: 4,
    words: [
      'FISH', 'STAR', 'MOON', 'FROG', 'DUCK', 'BOAT', 'TREE', 'CAKE', 'BALL',
      'BIRD', 'LION', 'NEST', 'RAIN', 'LEAF', 'HAND', 'MILK', 'RING', 'KITE',
      'GOAT', 'BELL', 'DOOR', 'FLAG', 'CORN', 'DRUM',
    ],
  },
  {
    id: 'nightsky', name: 'Night Sky', emoji: '🌙', len: 5,
    words: [
      'APPLE', 'HOUSE', 'TRAIN', 'HORSE', 'PLANT', 'BREAD', 'CLOUD', 'SNAKE',
      'MOUSE', 'CHAIR', 'SMILE', 'BEACH', 'LIGHT', 'STONE', 'SHEEP', 'CROWN',
      'HEART', 'ROBOT', 'TIGER', 'ZEBRA',
    ],
  },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Choose a word from a given list, avoiding an immediate repeat.
export function pickWord(list, prev) {
  let w = pick(list);
  while (w === prev && list.length > 1) w = pick(list);
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
