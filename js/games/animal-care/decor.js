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

export const decorById = (id) => DECOR.find((d) => d.id === id) || null;
