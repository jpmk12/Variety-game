// Occasional "baddies" the player can tap to web up for bonus points. These are
// ORIGINAL cartoon critters — playful nods to classic villain *archetypes*
// (a goblin, a many-armed one, a horned brute) but with our own designs, names,
// and colors. No trademarked characters, names, or costumes.

// Each returns an inline SVG (viewBox 0 0 100 100), drawn as a silly bug.

function goblinBug() {
  return `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 30 l-8 -18 l20 10z" fill="#3f9142"/>
    <path d="M80 30 l8 -18 l-20 10z" fill="#3f9142"/>
    <circle cx="50" cy="55" r="34" fill="#5bbf5b"/>
    <ellipse cx="50" cy="66" rx="20" ry="14" fill="#8fe08f"/>
    <circle cx="39" cy="48" r="7" fill="#fff"/><circle cx="40" cy="49" r="3.5" fill="#222"/>
    <circle cx="61" cy="48" r="7" fill="#fff"/><circle cx="60" cy="49" r="3.5" fill="#222"/>
    <path d="M38 68 q12 8 24 0" stroke="#2c6e2c" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M42 72 l3 4 3 -4 3 4 3 -4" stroke="#fff" stroke-width="2" fill="none"/>
  </svg>`;
}

function octoBug() {
  return `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g stroke="#7b52c9" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M30 60 q-18 6 -20 24"/><path d="M38 66 q-10 14 -24 20"/>
      <path d="M70 60 q18 6 20 24"/><path d="M62 66 q10 14 24 20"/>
    </g>
    <circle cx="50" cy="50" r="32" fill="#9b6ff0"/>
    <ellipse cx="50" cy="44" rx="22" ry="16" fill="#c3a3ff"/>
    <circle cx="41" cy="44" r="6.5" fill="#fff"/><circle cx="42" cy="45" r="3.2" fill="#222"/>
    <circle cx="59" cy="44" r="6.5" fill="#fff"/><circle cx="58" cy="45" r="3.2" fill="#222"/>
    <path d="M40 62 q10 7 20 0" stroke="#5b3aa0" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function rhinoBug() {
  return `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="50" cy="56" r="34" fill="#9aa3ad"/>
    <ellipse cx="50" cy="66" rx="20" ry="13" fill="#c2c9d1"/>
    <path d="M50 20 l7 16 h-14z" fill="#eef2f6"/>
    <circle cx="40" cy="52" r="6.5" fill="#fff"/><circle cx="41" cy="53" r="3.2" fill="#222"/>
    <circle cx="60" cy="52" r="6.5" fill="#fff"/><circle cx="59" cy="53" r="3.2" fill="#222"/>
    <path d="M40 70 q10 6 20 0" stroke="#5f6873" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="30" y="40" width="8" height="4" rx="2" fill="#6b7480"/>
    <rect x="62" y="40" width="8" height="4" rx="2" fill="#6b7480"/>
  </svg>`;
}

export const ENEMIES = [
  { id: 'goblin', name: 'Gribble', svg: goblinBug() },
  { id: 'octo', name: 'Ocko', svg: octoBug() },
  { id: 'rhino', name: 'Ryno', svg: rhinoBug() },
];

export const ENEMY_BONUS = 5; // points for webbing one up
