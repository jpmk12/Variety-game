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

// `details` is a cosmetic SVG overlay drawn ONLY on the finished creation (the
// reveal), in the same 0 0 200 200 space as the assembled pieces. It's never
// cut or welded — it just turns a plain polygon into a rocket-with-a-window or
// a robot-with-a-face so the payoff screen is as characterful as the tools.
const FACE = `<g fill="#3a3357"><circle cx="90" cy="86" r="4"/><circle cx="110" cy="86" r="4"/></g>
  <path d="M89 98 q11 9 22 0" stroke="#3a3357" stroke-width="3" fill="none" stroke-linecap="round"/>`;

export const BUILDS = [
  {
    id: 'star', name: 'Star', emoji: '⭐',
    pieces: [{ id: 'star', name: 'Star', path: STAR, fill: '#ffd166', asm: 'translate(0 0)' }],
    seams: [],
    rivets: [],
    details: FACE + `<g fill="#fff8"><circle cx="82" cy="80" r="2.5"/><circle cx="120" cy="112" r="2"/></g>`,
  },
  {
    id: 'rocket', name: 'Rocket', emoji: '🚀',
    pieces: [
      { id: 'body', name: 'Body', path: BODY, fill: '#8ecae6', asm: 'translate(0 6)' },
      { id: 'nose', name: 'Nose', path: NOSE, fill: '#ff6b6b', asm: 'translate(0 -44)' },
    ],
    seams: [{ x1: 74, y1: 70, x2: 126, y2: 70 }],
    rivets: [],
    // porthole window on the body + swept fins at the base + a little flame
    details: `<circle cx="100" cy="108" r="15" fill="#dff3ff" stroke="#3d7ea6" stroke-width="4"/>
      <circle cx="94" cy="102" r="4" fill="#fff" opacity="0.8"/>
      <path d="M72 134 L54 160 L72 152 Z" fill="#ef5b5b"/><path d="M128 134 L146 160 L128 152 Z" fill="#ef5b5b"/>
      <path d="M88 156 q12 22 24 0 q-6 14 -12 14 q-6 0 -12 -14 Z" fill="#ffb703"/>`,
  },
  {
    id: 'robot', name: 'Robot', emoji: '🤖',
    pieces: [
      { id: 'head', name: 'Head', path: SQUARE, fill: '#bdb2ff', asm: 'translate(0 -46)' },
      { id: 'body', name: 'Body', path: SQUARE, fill: '#90be6d', asm: 'translate(0 42)' },
    ],
    seams: [{ x1: 72, y1: 96, x2: 128, y2: 96 }],
    rivets: [{ cx: 82, cy: 140 }, { cx: 118, cy: 140 }],
    // antenna, eyes + smile on the head, a control panel + arms on the body
    details: `<line x1="100" y1="14" x2="100" y2="2" stroke="#7a7a8c" stroke-width="4"/><circle cx="100" cy="0" r="5" fill="#ff6b6b"/>
      <circle cx="84" cy="48" r="9" fill="#fff"/><circle cx="116" cy="48" r="9" fill="#fff"/><circle cx="84" cy="48" r="4" fill="#3a3357"/><circle cx="116" cy="48" r="4" fill="#3a3357"/>
      <path d="M84 68 q16 10 32 0" stroke="#3a3357" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="46" y="116" width="12" height="40" rx="6" fill="#7aa155"/><rect x="142" y="116" width="12" height="40" rx="6" fill="#7aa155"/>
      <circle cx="88" cy="128" r="5" fill="#f9c74f"/><circle cx="112" cy="128" r="5" fill="#f94144"/>`,
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
    // side handles + a shiny "1" star on the cup
    details: `<path d="M64 28 C44 28 44 62 66 62" stroke="#ffd166" stroke-width="7" fill="none"/>
      <path d="M136 28 C156 28 156 62 134 62" stroke="#ffd166" stroke-width="7" fill="none"/>
      <path d="M100 30 l4 10 11 0 -9 7 4 11 -10 -7 -10 7 4 -11 -9 -7 11 0 Z" fill="#fff" opacity="0.85"/>`,
  },
];

export const MAX_LEVEL = BUILDS.length;

export function buildFor(level) {
  return BUILDS[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
}
