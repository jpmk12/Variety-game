// Shapes, colors, and rounds for Shape Sorters — a gentle sorting/logic game.
// Each round shows one item (a colored shape) and a row of bins; the child taps
// the bin it belongs in. The sorting rule changes by level: sometimes sort by
// SHAPE (ignore the color), sometimes by COLOR (ignore the shape).

export const SHAPES = [
  { id: 'circle',   name: 'Circle' },
  { id: 'square',   name: 'Square' },
  { id: 'triangle', name: 'Triangle' },
  { id: 'star',     name: 'Star' },
];

export const COLORS = [
  { id: 'red',    name: 'Red',    hex: '#ff6b6b' },
  { id: 'blue',   name: 'Blue',   hex: '#5aa9ff' },
  { id: 'yellow', name: 'Yellow', hex: '#ffd166' },
  { id: 'green',  name: 'Green',  hex: '#5ec98a' },
];

export function colorHex(id) { return (COLORS.find((c) => c.id === id) || {}).hex || '#b0a8d0'; }
export function shapeName(id) { return (SHAPES.find((s) => s.id === id) || {}).name || id; }

// Inline SVG for each shape, filled with a given color.
const PATHS = {
  circle: (c) => `<circle cx="50" cy="50" r="38" fill="${c}"/>`,
  square: (c) => `<rect x="14" y="14" width="72" height="72" rx="12" fill="${c}"/>`,
  triangle: (c) => `<polygon points="50,14 88,84 12,84" fill="${c}"/>`,
  star: (c) => `<polygon points="50,8 61,38 93,38 67,58 77,90 50,70 23,90 33,58 7,38 39,38" fill="${c}"/>`,
};

export function shapeSVG(shapeId, color = '#b0a8d0') {
  const draw = PATHS[shapeId] || PATHS.circle;
  return `<svg viewBox="0 0 100 100" class="ss-shape-svg" role="img" aria-label="${shapeId}">${draw(color)}</svg>`;
}

// Each level: what to sort by, and which bins are on the table.
export const LEVELS = [
  { sortBy: 'shape', bins: ['circle', 'square'] },
  { sortBy: 'shape', bins: ['circle', 'square', 'triangle'] },
  { sortBy: 'color', bins: ['red', 'blue', 'yellow', 'green'] },
  { sortBy: 'shape', bins: ['circle', 'square', 'triangle', 'star'] },
];
export const MAX_LEVEL = LEVELS.length;

export function levelCfg(level) {
  return LEVELS[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
}

// Make one round for a level: an item plus the bin it belongs in. The attribute
// that DOESN'T matter is randomized, so kids learn to focus on the rule.
export function makeRound(level, rng = Math.random) {
  const cfg = levelCfg(level);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const answer = pick(cfg.bins);
  let shape, color;
  if (cfg.sortBy === 'shape') {
    shape = answer;
    color = pick(COLORS).id;
  } else {
    color = answer;
    shape = pick(SHAPES).id;
  }
  return { sortBy: cfg.sortBy, bins: [...cfg.bins], answer, item: { shape, color } };
}
