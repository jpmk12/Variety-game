// Karate belts for Letter Samurai — a rank that grows with the child's lifetime
// correct slashes (the shared `samCorrect` counter). Purely derived from that
// count, so there's nothing extra to persist.

export const BELTS = [
  { name: 'White',  color: '#eef0f4', ink: '#3a3357', at: 0 },
  { name: 'Yellow', color: '#ffe14d', ink: '#3a3357', at: 10 },
  { name: 'Orange', color: '#ff9f43', ink: '#ffffff', at: 25 },
  { name: 'Green',  color: '#1dd1a1', ink: '#ffffff', at: 50 },
  { name: 'Blue',   color: '#54a0ff', ink: '#ffffff', at: 100 },
  { name: 'Red',    color: '#ff6b6b', ink: '#ffffff', at: 175 },
  { name: 'Black',  color: '#3a3357', ink: '#ffffff', at: 275 },
];

// The highest belt earned for a given lifetime correct-slash count.
export function beltFor(count) {
  let belt = BELTS[0];
  for (const b of BELTS) if (count >= b.at) belt = b;
  return belt;
}

// The next belt up (or null if already at the top).
export function nextBelt(count) {
  return BELTS.find((b) => b.at > count) || null;
}

// Progress toward the next belt as { have, need, frac } (frac 0..1). At the top
// belt, frac is 1.
export function beltProgress(count) {
  const cur = beltFor(count);
  const next = nextBelt(count);
  if (!next) return { have: count - cur.at, need: 0, frac: 1 };
  const span = next.at - cur.at;
  const have = count - cur.at;
  return { have, need: next.at - count, frac: Math.max(0, Math.min(1, have / span)) };
}
