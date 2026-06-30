// Stat model for each animal. Four needs, 0..100, higher = better.
// Stats decay slowly over real time so returning feels alive but never punishing.

export const STAT_KEYS = ['hunger', 'thirst', 'cleanliness', 'happiness'];

// Full = "tummy full / well watered / squeaky clean / delighted".
export function freshStats() {
  return { hunger: 100, thirst: 100, cleanliness: 100, happiness: 100 };
}

// Gentle decay per hour for each need. Happiness drifts a touch faster because
// playing is the most fun, but everything stays high for a long while.
const DECAY_PER_HOUR = {
  hunger: 8,
  thirst: 10,
  cleanliness: 5,
  happiness: 7,
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
export function moodFor(stats) {
  const score = overall(stats);
  if (score >= 80) return { key: 'great', face: '😄' };
  if (score >= 55) return { key: 'good', face: '🙂' };
  if (score >= 30) return { key: 'meh', face: '😕' };
  return { key: 'sad', face: '😢' };
}
