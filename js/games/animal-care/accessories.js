// Dress-up accessories the child buys with ⭐ stars and equips on a pet. Each
// lives in a "slot" (only one per slot at a time) and carries a position — a
// fraction of the pet's box — so the same item sits right on any pet at any
// size. Positions are tuned against the SVG pets (head high, neck near the
// bottom) and verified with screenshots.

export const SLOTS = ['hat', 'face', 'neck'];

// x/y are percent of the pet box (0..100); size is a fraction of the box width
// used as the emoji font-size, so accessories scale with the pet everywhere.
// y is tuned to the shared 0 0 200 200 pets: head top ≈ 23%, eyes ≈ 43%,
// neck/chest ≈ 60%. Hats rest just on the crown, shades sit on the eyes,
// neckwear tucks under the chin.
export const ACCESSORIES = [
  { id: 'bow',     emoji: '🎀', name: 'Bow',        slot: 'hat',  cost: 8,  x: 50, y: 18, size: 0.34 },
  { id: 'cap',     emoji: '🧢', name: 'Ball Cap',   slot: 'hat',  cost: 10, x: 50, y: 15, size: 0.46 },
  { id: 'tophat',  emoji: '🎩', name: 'Top Hat',    slot: 'hat',  cost: 14, x: 50, y: 12, size: 0.48 },
  { id: 'flower',  emoji: '🌸', name: 'Flower',     slot: 'hat',  cost: 6,  x: 66, y: 20, size: 0.30 },
  { id: 'crown',   emoji: '👑', name: 'Crown',      slot: 'hat',  cost: 30, x: 50, y: 14, size: 0.46 },
  { id: 'glasses', emoji: '🕶️', name: 'Cool Shades', slot: 'face', cost: 16, x: 50, y: 43, size: 0.44 },
  { id: 'scarf',   emoji: '🧣', name: 'Cozy Scarf', slot: 'neck', cost: 12, x: 50, y: 64, size: 0.42 },
  { id: 'medal',   emoji: '🏅', name: 'Gold Medal', slot: 'neck', cost: 22, x: 50, y: 66, size: 0.36 },
  { id: 'bowtie',  emoji: '🎗️', name: 'Ribbon',     slot: 'neck', cost: 9,  x: 50, y: 62, size: 0.32 },
];

export function accessoryById(id) { return ACCESSORIES.find((a) => a.id === id) || null; }
