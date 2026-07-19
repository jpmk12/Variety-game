// Stat model for each animal. Four needs, 0..100, higher = better.
// Stats decay slowly over real time so returning feels alive but never punishing.

export const STAT_KEYS = ['hunger', 'thirst', 'cleanliness', 'tidy', 'happiness', 'energy'];

// Per-need display metadata, shared by the needs meter, thought bubbles, and
// the action that restores it. Order = how the meter panel reads left to right.
export const NEEDS = [
  { key: 'hunger', label: 'Food', icon: '🍖', color: '#ff9f68', action: 'feed' },
  { key: 'thirst', label: 'Water', icon: '💧', color: '#5ec8ff', action: 'water' },
  { key: 'cleanliness', label: 'Clean', icon: '🫧', color: '#9be7c4', action: 'bath' },
  { key: 'tidy', label: 'Brushed', icon: '🪮', color: '#c9b6ff', action: 'brush' },
  { key: 'happiness', label: 'Happy', icon: '❤️', color: '#ff6b9d', action: 'play' },
  { key: 'energy', label: 'Rested', icon: '🌙', color: '#8a8de0', action: 'nighttime' },
];

// Below LOW a pet asks for help (thought bubble); at/above CONTENT for every
// need the pet is fully cared for (celebration).
export const LOW_THRESHOLD = 35;
export const CONTENT_THRESHOLD = 90;

// Full = every need topped up.
export function freshStats() {
  return { hunger: 100, thirst: 100, cleanliness: 100, tidy: 100, happiness: 100, energy: 100 };
}

// Gentle decay per hour for each need. Happiness drifts a touch faster because
// playing is the most fun, but everything stays high for a long while.
const DECAY_PER_HOUR = {
  hunger: 8,
  thirst: 10,
  cleanliness: 5,
  tidy: 5,
  happiness: 7,
  energy: 6,
};

const clamp = (n) => Math.max(0, Math.min(100, n));

// Apply elapsed-time decay. `elapsedMs` is real time since last save.
export function applyDecay(stats, elapsedMs) {
  const hours = Math.max(0, elapsedMs) / 3_600_000;
  const out = { ...stats };
  for (const key of STAT_KEYS) {
    const dec = (DECAY_PER_HOUR[key] || 0) * hours;
    out[key] = clamp((out[key] ?? 100) - dec);
  }
  return out;
}

// Average of all needs — drives the mood face.
export function overall(stats) {
  const sum = STAT_KEYS.reduce((acc, k) => acc + (stats[k] ?? 0), 0);
  return sum / STAT_KEYS.length;
}

// Map overall wellbeing to a mood used for the floating face + animation.
// Little round mood faces drawn in the same flat-vector style as the pets, so
// the floating mood indicator matches the art instead of using an OS emoji.
const MOOD_SVG = {
  great: `<svg viewBox="0 0 100 100" class="ac-face-svg" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#ffcf3e"/>
    <path d="M28 40 q7 -9 14 0" stroke="#6a5216" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M58 40 q7 -9 14 0" stroke="#6a5216" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M30 58 q20 24 40 0 Z" fill="#6a5216"/><path d="M38 66 q12 8 24 0" fill="#ff7d9c"/></svg>`,
  good: `<svg viewBox="0 0 100 100" class="ac-face-svg" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#ffd54a"/>
    <circle cx="37" cy="45" r="4.5" fill="#6a5216"/><circle cx="63" cy="45" r="4.5" fill="#6a5216"/>
    <path d="M36 62 q14 13 28 0" stroke="#6a5216" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`,
  meh: `<svg viewBox="0 0 100 100" class="ac-face-svg" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#ffe39a"/>
    <circle cx="37" cy="46" r="4.5" fill="#6a5216"/><circle cx="63" cy="46" r="4.5" fill="#6a5216"/>
    <path d="M37 65 h26" stroke="#6a5216" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`,
  sad: `<svg viewBox="0 0 100 100" class="ac-face-svg" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#a9c8e8"/>
    <circle cx="37" cy="47" r="4.5" fill="#3a4a5e"/><circle cx="63" cy="47" r="4.5" fill="#3a4a5e"/>
    <path d="M37 68 q13 -12 26 0" stroke="#3a4a5e" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M64 54 q5 9 0 15 q-5 -6 0 -15 Z" fill="#5aa9ff"/></svg>`,
};

export function moodFor(stats) {
  const score = overall(stats);
  const pick = (key, face) => ({ key, face, svg: MOOD_SVG[key] });
  if (score >= 80) return pick('great', '😄');
  if (score >= 55) return pick('good', '🙂');
  if (score >= 30) return pick('meh', '😕');
  return pick('sad', '😢');
}

// The most-depleted need, but only if it has dropped below LOW_THRESHOLD.
// Returns the NEEDS entry (so callers get its icon/action) or null.
export function lowestNeed(stats) {
  let worst = null;
  for (const need of NEEDS) {
    const val = stats[need.key] ?? 100;
    if (val < LOW_THRESHOLD && (worst === null || val < (stats[worst.key] ?? 100))) {
      worst = need;
    }
  }
  return worst;
}

// True when every need is topped up — the pet is completely happy.
export function allContent(stats) {
  return STAT_KEYS.every((k) => (stats[k] ?? 0) >= CONTENT_THRESHOLD);
}
