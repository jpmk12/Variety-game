// Room decorations for Animal Care — a second star-sink beside dress-up. Each
// item is bought once with ⭐ stars, then toggled on/off; placed items render in
// the room at a fixed spot (x/y are percentages of the room, size is a font
// multiplier). Kept simple and reliable: fixed positions, no free dragging.

export const DECOR = [
  { id: 'plant',    emoji: '🪴', name: 'Plant',    cost: 8,  x: 7,  y: 66, size: 3.4 },
  { id: 'teddy',    emoji: '🧸', name: 'Teddy',    cost: 7,  x: 16, y: 82, size: 3.0 },
  { id: 'balloons', emoji: '🎈', name: 'Balloons', cost: 10, x: 24, y: 14, size: 3.2 },
  { id: 'poster',   emoji: '🖼️', name: 'Poster',   cost: 12, x: 72, y: 18, size: 3.4 },
  { id: 'lamp',     emoji: '🏮', name: 'Lantern',  cost: 9,  x: 90, y: 40, size: 3.2 },
  { id: 'bed',      emoji: '🛏️', name: 'Pet Bed',  cost: 15, x: 86, y: 80, size: 3.8 },
  { id: 'plush',    emoji: '🌵', name: 'Cactus',   cost: 6,  x: 94, y: 66, size: 2.8 },
  { id: 'ball',     emoji: '🎾', name: 'Toy Ball', cost: 5,  x: 50, y: 90, size: 2.4 },
];

// Flat-vector art for each decoration, in the pets' style so the room isn't a
// crafted scene with OS emoji stuck on. Each is centred in a 0 0 100 100 box.
const DECOR_SVG = {
  plant: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="#4caf50"><path d="M50 58 C38 30 22 36 34 54 Z"/><path d="M50 58 C62 28 80 36 66 54 Z"/><path d="M50 58 C47 24 53 24 50 58 Z"/></g><path d="M34 58 h32 l-4 30 h-24 Z" fill="#c17a4a"/><rect x="31" y="52" width="38" height="10" rx="3" fill="#a5613a"/></svg>`,
  teddy: `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="33" cy="30" r="9" fill="#b5793f"/><circle cx="67" cy="30" r="9" fill="#b5793f"/><ellipse cx="50" cy="72" rx="22" ry="18" fill="#c98a4e"/><circle cx="50" cy="70" r="9" fill="#e5c199"/><circle cx="50" cy="40" r="20" fill="#c98a4e"/><circle cx="43" cy="38" r="3" fill="#3a2a1a"/><circle cx="57" cy="38" r="3" fill="#3a2a1a"/><circle cx="50" cy="45" r="4" fill="#3a2a1a"/></svg>`,
  balloons: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M38 48 q4 22 8 44 M63 54 q-2 18 -6 38" stroke="#9aa0b5" stroke-width="2" fill="none"/><ellipse cx="38" cy="30" rx="15" ry="18" fill="#ff5b6e"/><ellipse cx="63" cy="36" rx="14" ry="17" fill="#5aa9ff"/><circle cx="33" cy="24" r="4" fill="#fff" opacity="0.4"/></svg>`,
  poster: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="24" y="22" width="52" height="56" rx="3" fill="#8a6a3a"/><rect x="30" y="28" width="40" height="44" fill="#bfe3ff"/><circle cx="42" cy="40" r="6" fill="#ffd23e"/><path d="M30 68 l14 -16 12 10 10 -8 4 6 v6 Z" fill="#7ec97e"/></svg>`,
  lamp: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="44" y="14" width="12" height="6" fill="#8a1f2a"/><ellipse cx="50" cy="50" rx="26" ry="30" fill="#e63950"/><rect x="24" y="46" width="52" height="8" fill="#c81e3c" opacity="0.45"/><rect x="42" y="78" width="16" height="8" fill="#f2b705"/><path d="M50 80 v12" stroke="#f2b705" stroke-width="3"/></svg>`,
  bed: `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="68" rx="40" ry="20" fill="#5a86b8"/><ellipse cx="50" cy="64" rx="40" ry="16" fill="#7aa8d8"/><ellipse cx="50" cy="62" rx="28" ry="10" fill="#c3ddf2"/></svg>`,
  plush: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="38" y="70" width="24" height="18" rx="3" fill="#c17a4a"/><rect x="35" y="66" width="30" height="8" rx="3" fill="#a5613a"/><rect x="44" y="26" width="12" height="46" rx="6" fill="#4caf50"/><rect x="28" y="44" width="10" height="20" rx="5" fill="#4caf50"/><rect x="62" y="38" width="10" height="24" rx="5" fill="#4caf50"/><circle cx="50" cy="28" r="3" fill="#ff9ec4"/></svg>`,
  ball: `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="30" fill="#c6e94a"/><path d="M28 32 q14 18 0 36 M72 32 q-14 18 0 36" stroke="#fff" stroke-width="3" fill="none"/></svg>`,
};

export const decorById = (id) => DECOR.find((d) => d.id === id) || null;
export const decorSVG = (id) => DECOR_SVG[id] || '';
