// The metal creations you build in Metal Makers, one per level. Each build is a
// little pipeline: cut every PIECE out of a metal sheet with the torch, WELD the
// seams that join them, RIVET the fastening holes, then reveal the finished
// creation. The pieces double as the art — each is an SVG shape that's traced
// when cutting and shown (via its `asm` transform) in the assembled views.

// Shape paths, drawn to sit nicely in a 0 0 200 200 sheet, centered ~ (100,100).
const STAR   = 'M100 34 L113 74 L155 74 L121 99 L134 140 L100 115 L66 140 L79 99 L45 74 L87 74 Z';
const NOSE   = 'M100 46 L146 140 L54 140 Z';
const BODY   = 'M72 58 h56 v92 h-56 Z';
const SQUARE = 'M60 60 h80 v80 h-80 Z';
const WBASE  = 'M52 120 h96 v34 h-96 Z';
const STEM   = 'M90 92 h20 v44 h-20 Z';
const CUP    = 'M62 58 h76 l-12 52 h-52 Z';

export const BUILDS = [
  {
    id: 'star', name: 'Star', emoji: '⭐',
    pieces: [{ id: 'star', name: 'Star', path: STAR, fill: '#ffd166', asm: 'translate(0 0)' }],
    seams: [],
    rivets: [],
  },
  {
    id: 'rocket', name: 'Rocket', emoji: '🚀',
    pieces: [
      { id: 'body', name: 'Body', path: BODY, fill: '#8ecae6', asm: 'translate(0 6)' },
      { id: 'nose', name: 'Nose', path: NOSE, fill: '#ff6b6b', asm: 'translate(0 -44)' },
    ],
    seams: [{ x1: 74, y1: 70, x2: 126, y2: 70 }],
    rivets: [],
  },
  {
    id: 'robot', name: 'Robot', emoji: '🤖',
    pieces: [
      { id: 'head', name: 'Head', path: SQUARE, fill: '#bdb2ff', asm: 'translate(0 -46)' },
      { id: 'body', name: 'Body', path: SQUARE, fill: '#90be6d', asm: 'translate(0 42)' },
    ],
    seams: [{ x1: 72, y1: 96, x2: 128, y2: 96 }],
    rivets: [{ cx: 82, cy: 140 }, { cx: 118, cy: 140 }],
  },
  {
    id: 'trophy', name: 'Trophy', emoji: '🏆',
    pieces: [
      { id: 'cup',  name: 'Cup',  path: CUP,   fill: '#ffd166', asm: 'translate(0 -34)' },
      { id: 'stem', name: 'Stem', path: STEM,  fill: '#f4a259', asm: 'translate(0 6)' },
      { id: 'base', name: 'Base', path: WBASE, fill: '#e0a64f', asm: 'translate(0 30)' },
    ],
    seams: [{ x1: 84, y1: 66, x2: 116, y2: 66 }, { x1: 78, y1: 128, x2: 122, y2: 128 }],
    rivets: [{ cx: 74, cy: 146 }, { cx: 126, cy: 146 }],
  },
];

export const MAX_LEVEL = BUILDS.length;

export function buildFor(level) {
  return BUILDS[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
}
