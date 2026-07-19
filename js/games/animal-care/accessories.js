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

// Flat-vector art for each accessory, drawn in the pets' style so a dressed-up
// pet looks hand-made rather than having an OS emoji pasted on. Each sits in a
// 0 0 100 100 box centred on the accessory's x/y anchor.
const ACC_SVG = {
  bow: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 50 L16 32 q-9 18 0 36 Z" fill="#ff7d9c"/><path d="M50 50 L84 32 q9 18 0 36 Z" fill="#ff7d9c"/><path d="M50 50 L20 34 q-3 5 0 10 Z" fill="#e85d84"/><path d="M50 50 L80 34 q3 5 0 10 Z" fill="#e85d84"/><circle cx="50" cy="50" r="10" fill="#e85d84"/></svg>`,
  cap: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M24 58 a26 24 0 0 1 52 0 Z" fill="#3a86ff"/><path d="M74 58 q18 -2 20 8 q-16 6 -24 -2 Z" fill="#2f6fd6"/><rect x="22" y="55" width="56" height="8" rx="4" fill="#2f6fd6"/><circle cx="50" cy="36" r="4" fill="#2f6fd6"/></svg>`,
  tophat: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="16" y="66" width="68" height="10" rx="5" fill="#2a2f45"/><rect x="30" y="24" width="40" height="44" rx="5" fill="#2a2f45"/><rect x="30" y="52" width="40" height="10" fill="#e63950"/></svg>`,
  flower: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="#ff9ec4"><circle cx="50" cy="30" r="14"/><circle cx="71" cy="44" r="14"/><circle cx="63" cy="68" r="14"/><circle cx="37" cy="68" r="14"/><circle cx="29" cy="44" r="14"/></g><circle cx="50" cy="50" r="13" fill="#ffd23e"/></svg>`,
  crown: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M22 72 L22 40 L37 54 L50 32 L63 54 L78 40 L78 72 Z" fill="#ffcf3e"/><rect x="20" y="68" width="60" height="11" rx="3" fill="#f2b705"/><circle cx="50" cy="46" r="4.5" fill="#ff5b6e"/><circle cx="34" cy="60" r="3.5" fill="#5aa9ff"/><circle cx="66" cy="60" r="3.5" fill="#5aa9ff"/></svg>`,
  glasses: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="12" y="40" width="32" height="22" rx="10" fill="#2a2f45"/><rect x="56" y="40" width="32" height="22" rx="10" fill="#2a2f45"/><path d="M44 46 q6 -5 12 0" stroke="#2a2f45" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M18 46 l8 6" stroke="#fff" stroke-width="3" opacity="0.4" stroke-linecap="round"/></svg>`,
  scarf: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M22 44 q28 18 56 0 l0 13 q-28 16 -56 0 Z" fill="#e63950"/><rect x="41" y="56" width="15" height="30" rx="4" fill="#c81e3c"/><rect x="41" y="80" width="15" height="6" fill="#a01730"/></svg>`,
  medal: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M38 18 L49 50 L43 54 L32 22 Z" fill="#5aa9ff"/><path d="M62 18 L51 50 L57 54 L68 22 Z" fill="#ff5b6e"/><circle cx="50" cy="64" r="21" fill="#ffcf3e" stroke="#f2b705" stroke-width="3"/><path d="M50 53 l3 8 9 0 -7 6 3 9 -8 -5 -8 5 3 -9 -7 -6 9 0 Z" fill="#fff" opacity="0.9"/></svg>`,
  bowtie: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M39 82 C46 58 49 46 56 26" stroke="#9b5de5" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M61 82 C54 58 51 46 44 26" stroke="#b07bec" stroke-width="10" fill="none" stroke-linecap="round"/></svg>`,
};

export function accessoryById(id) { return ACCESSORIES.find((a) => a.id === id) || null; }
export function accessorySVG(id) { return ACC_SVG[id] || ''; }
