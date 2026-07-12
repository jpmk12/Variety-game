// Puzzles for Word Builders. We reuse the tiered word lists from Climb & Spell
// (3 → 4 → 5 letters) so spelling words live in one place across the app, and
// wrap them with per-level settings: which tier, how many distractor blocks to
// scatter, and whether the slots show a faint "engraved" hint letter.

import { WORLDS, pickWord, distractors } from '../climb-spell/words.js';

// Level → word tier (index into WORLDS), extra decoy blocks, and hint on/off.
export const LEVELS = [
  { world: 0, decoys: 0, hint: true },   // 3 letters, letters engraved in the slots
  { world: 0, decoys: 1, hint: false },  // 3 letters, one decoy, no hint
  { world: 1, decoys: 1, hint: false },  // 4 letters
  { world: 2, decoys: 2, hint: false },  // 5 letters
];
export const MAX_LEVEL = LEVELS.length;

export function levelCfg(level) {
  return LEVELS[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build one puzzle: the target word, its slot letters, and the scattered blocks
// (the word's letters plus a few decoys that aren't in the word), shuffled.
// rng is injectable so tests are deterministic.
export function makePuzzle(level, prev, rng = Math.random) {
  const cfg = levelCfg(level);
  const world = WORLDS[cfg.world];
  const word = pickWord(world.words, prev);
  const letters = word.split('');
  const decoys = distractors(word[0], letters, cfg.decoys);
  const blocks = shuffle([...letters, ...decoys], rng);
  return { word, letters, blocks, hint: cfg.hint };
}
