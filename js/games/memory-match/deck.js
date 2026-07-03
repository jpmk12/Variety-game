// Card deck for Pet Pairs (Memory Match). Every card face is a pet we already
// draw in Animal Care, so the art comes for free. Higher levels need more
// distinct faces than we have pets, so we add a few "dressed up" variants: a
// pet wearing a small accessory badge. A card only matches another card with
// the SAME pet AND the SAME accessory.

import { ANIMALS } from '../animal-care/animals.js';

// Per level: how many pairs, and how many columns the grid uses (rows derived).
// L1 2x2, L2 3x2, L3 4x3, L4 4x4 — a gentle ramp with no fail state.
export const LEVELS = [
  { pairs: 2, cols: 2 },
  { pairs: 3, cols: 3 },
  { pairs: 6, cols: 4 },
  { pairs: 8, cols: 4 },
];
export const MAX_LEVEL = LEVELS.length;

// Extra faces beyond the five pets: a pet + a tiny accessory badge.
const VARIANTS = [
  { animalId: 'dog', accessory: '🎀' },
  { animalId: 'cat', accessory: '🎩' },
  { animalId: 'unicorn', accessory: '⭐' },
];

// The ordered pool of distinct faces: the five plain pets first, then the
// dressed-up variants. Levels take the first N of these.
function facePool() {
  const plain = ANIMALS.map((a) => ({
    key: a.id, animalId: a.id, name: a.name, svg: a.svg, accessory: '',
  }));
  const dressed = VARIANTS.map((v) => {
    const a = ANIMALS.find((x) => x.id === v.animalId);
    return {
      key: a.id + ':' + v.accessory, animalId: a.id, name: a.name,
      svg: a.svg, accessory: v.accessory,
    };
  });
  return [...plain, ...dressed];
}

export function levelInfo(level) {
  return LEVELS[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
}

// Build a shuffled deck for a level: `pairs` distinct faces, two cards each.
// rng defaults to Math.random but is injectable so tests stay deterministic.
export function buildDeck(level, rng = Math.random) {
  const { pairs } = levelInfo(level);
  const faces = facePool().slice(0, pairs);
  const cards = [];
  faces.forEach((f, i) => {
    for (let n = 0; n < 2; n++) {
      cards.push({ id: i * 2 + n, key: f.key, animalId: f.animalId, name: f.name, svg: f.svg, accessory: f.accessory });
    }
  });
  return shuffle(cards, rng);
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
