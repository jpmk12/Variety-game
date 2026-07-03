// Cartoony animal characters as inline SVG. Every animatable part carries a
// class (ac-tail, ac-ear-*, ac-eye-*, ac-mouth, ac-body, ac-head, ac-prop) so
// css/animations.css can wag tails, blink eyes, and bounce bodies per action.
// All three share a 0 0 200 200 viewBox and sit on a baseline near y=180.

// --- DOG: floppy-eared golden pup ---
function dogSVG() {
  return `
  <svg class="ac-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dog">
    <ellipse class="ac-shadow" cx="100" cy="188" rx="58" ry="10"/>
    <g class="ac-body-group">
      <!-- tail -->
      <path class="ac-tail" d="M150 150 q35 -8 30 -42 q-3 22 -28 26 z" fill="#d99a4e"/>
      <!-- body -->
      <ellipse class="ac-body" cx="100" cy="140" rx="62" ry="46" fill="#f0b65e"/>
      <ellipse cx="100" cy="158" rx="40" ry="26" fill="#fbd9a0"/>
      <!-- legs -->
      <rect x="64" y="168" width="20" height="22" rx="9" fill="#e0a64f"/>
      <rect x="116" y="168" width="20" height="22" rx="9" fill="#e0a64f"/>
      <!-- head -->
      <g class="ac-head">
        <ellipse class="ac-ear-l" cx="58" cy="92" rx="16" ry="34" fill="#d99a4e"/>
        <ellipse class="ac-ear-r" cx="142" cy="92" rx="16" ry="34" fill="#d99a4e"/>
        <circle class="ac-headball" cx="100" cy="92" r="46" fill="#f5c372"/>
        <ellipse cx="100" cy="116" rx="30" ry="22" fill="#fbe2b6"/>
        <g class="ac-eye-l"><circle cx="84" cy="86" r="8" fill="#3a2a1a"/><circle cx="86" cy="83" r="2.5" fill="#fff"/></g>
        <g class="ac-eye-r"><circle cx="116" cy="86" r="8" fill="#3a2a1a"/><circle cx="118" cy="83" r="2.5" fill="#fff"/></g>
        <ellipse cx="100" cy="106" rx="9" ry="7" fill="#3a2a1a"/>
        <path class="ac-mouth" d="M88 120 q12 12 24 0" stroke="#7a5230" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path class="ac-tongue" d="M96 122 q4 12 8 0 z" fill="#ff7d9c"/>
      </g>
    </g>
  </svg>`;
}

// --- CAT: orange tabby with a swishy tail ---
function catSVG() {
  return `
  <svg class="ac-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cat">
    <ellipse class="ac-shadow" cx="100" cy="188" rx="54" ry="10"/>
    <g class="ac-body-group">
      <path class="ac-tail" d="M150 158 q44 6 26 -40 q-2 30 -30 24 z" fill="#f08a3c"/>
      <ellipse class="ac-body" cx="100" cy="146" rx="54" ry="42" fill="#f59c4a"/>
      <ellipse cx="100" cy="160" rx="34" ry="24" fill="#ffd9a8"/>
      <path d="M70 150 h60 M70 162 h60" stroke="#e07e2e" stroke-width="3" opacity="0.5"/>
      <rect x="70" y="170" width="18" height="20" rx="8" fill="#e58836"/>
      <rect x="112" y="170" width="18" height="20" rx="8" fill="#e58836"/>
      <g class="ac-head">
        <path class="ac-ear-l" d="M60 64 l-6 -34 l30 16 z" fill="#f08a3c"/>
        <path class="ac-ear-r" d="M140 64 l6 -34 l-30 16 z" fill="#f08a3c"/>
        <path d="M62 56 l-3 -18 l16 9 z" fill="#ff9eb5"/>
        <path d="M138 56 l3 -18 l-16 9 z" fill="#ff9eb5"/>
        <circle class="ac-headball" cx="100" cy="86" r="44" fill="#f8a957"/>
        <g class="ac-eye-l"><ellipse cx="84" cy="82" rx="7" ry="10" fill="#2e7d32"/><circle cx="84" cy="80" r="3" fill="#10240f"/><circle cx="86" cy="77" r="1.6" fill="#fff"/></g>
        <g class="ac-eye-r"><ellipse cx="116" cy="82" rx="7" ry="10" fill="#2e7d32"/><circle cx="116" cy="80" r="3" fill="#10240f"/><circle cx="118" cy="77" r="1.6" fill="#fff"/></g>
        <path d="M100 96 l-6 6 h12 z" fill="#ff7d9c"/>
        <path class="ac-mouth" d="M100 102 v6 M100 108 q-8 6 -16 2 M100 108 q8 6 16 2" stroke="#7a4a1e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <g stroke="#cf7a2a" stroke-width="2" stroke-linecap="round">
          <path d="M70 96 h-22 M70 102 h-24"/>
          <path d="M130 96 h22 M130 102 h24"/>
        </g>
      </g>
    </g>
  </svg>`;
}

// --- UNICORN: white pony with a rainbow horn and pink mane ---
function unicornSVG() {
  return `
  <svg class="ac-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Unicorn">
    <ellipse class="ac-shadow" cx="100" cy="188" rx="56" ry="10"/>
    <g class="ac-body-group">
      <path class="ac-tail" d="M146 150 q40 4 34 46 q-12 -28 -34 -24 z" fill="#ff9ed6"/>
      <path class="ac-tail" d="M150 150 q34 8 24 44 q-6 -26 -26 -22 z" fill="#b18cff"/>
      <ellipse class="ac-body" cx="98" cy="142" rx="60" ry="44" fill="#fefdff"/>
      <ellipse cx="98" cy="158" rx="38" ry="24" fill="#f2ecff"/>
      <rect x="66" y="168" width="19" height="22" rx="9" fill="#efe9fb"/>
      <rect x="116" y="168" width="19" height="22" rx="9" fill="#efe9fb"/>
      <g class="ac-head">
        <ellipse class="ac-ear-l" cx="72" cy="58" rx="9" ry="18" fill="#fefdff"/>
        <ellipse class="ac-ear-r" cx="126" cy="56" rx="9" ry="18" fill="#fefdff"/>
        <!-- rainbow horn -->
        <g class="ac-horn">
          <path d="M100 18 l9 40 h-18 z" fill="#ffd166"/>
          <path d="M100 18 l4.5 20 h-9 z" fill="#ffe39a"/>
        </g>
        <!-- mane -->
        <path d="M70 44 q-14 18 -6 40 q12 -10 18 -6 q-8 -16 4 -30 z" fill="#ff9ed6"/>
        <path d="M70 60 q-12 14 -4 32 q10 -8 16 -4" fill="#b18cff"/>
        <circle class="ac-headball" cx="100" cy="78" r="42" fill="#fefdff"/>
        <ellipse cx="100" cy="98" rx="26" ry="20" fill="#f6f0ff"/>
        <g class="ac-eye-l"><circle cx="86" cy="76" r="7" fill="#5b3a8c"/><circle cx="88" cy="73" r="2.4" fill="#fff"/></g>
        <g class="ac-eye-r"><circle cx="114" cy="76" r="7" fill="#5b3a8c"/><circle cx="116" cy="73" r="2.4" fill="#fff"/></g>
        <ellipse cx="92" cy="100" rx="3.5" ry="2.5" fill="#d9a3c6"/>
        <ellipse cx="108" cy="100" rx="3.5" ry="2.5" fill="#d9a3c6"/>
        <path class="ac-mouth" d="M92 106 q8 8 16 0" stroke="#c98bb0" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="74" cy="92" r="6" fill="#ffc2dd" opacity="0.7"/>
        <circle cx="126" cy="92" r="6" fill="#ffc2dd" opacity="0.7"/>
      </g>
    </g>
  </svg>`;
}

// --- BUNNY: cream bunny with long pink-lined ears (hatches from the egg) ---
function bunnySVG() {
  return `
  <svg class="ac-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bunny">
    <ellipse class="ac-shadow" cx="100" cy="188" rx="52" ry="10"/>
    <g class="ac-body-group">
      <circle class="ac-tail" cx="150" cy="152" r="15" fill="#ffffff"/>
      <ellipse class="ac-body" cx="100" cy="144" rx="52" ry="44" fill="#f3eefb"/>
      <ellipse cx="100" cy="158" rx="34" ry="26" fill="#ffffff"/>
      <ellipse cx="80" cy="184" rx="16" ry="9" fill="#efe7fb"/>
      <ellipse cx="120" cy="184" rx="16" ry="9" fill="#efe7fb"/>
      <g class="ac-head">
        <g class="ac-ear-l"><ellipse cx="82" cy="44" rx="12" ry="38" fill="#f3eefb"/><ellipse cx="82" cy="46" rx="6" ry="27" fill="#ffc2dd"/></g>
        <g class="ac-ear-r"><ellipse cx="118" cy="44" rx="12" ry="38" fill="#f3eefb"/><ellipse cx="118" cy="46" rx="6" ry="27" fill="#ffc2dd"/></g>
        <circle class="ac-headball" cx="100" cy="102" r="46" fill="#f8f4fe"/>
        <circle cx="72" cy="114" r="10" fill="#ffd6e8"/>
        <circle cx="128" cy="114" r="10" fill="#ffd6e8"/>
        <g class="ac-eye-l"><circle cx="84" cy="98" r="8" fill="#4a3a5a"/><circle cx="86" cy="95" r="2.5" fill="#fff"/></g>
        <g class="ac-eye-r"><circle cx="116" cy="98" r="8" fill="#4a3a5a"/><circle cx="118" cy="95" r="2.5" fill="#fff"/></g>
        <path d="M100 110 l-6 6 h12 z" fill="#ff8fb3"/>
        <path class="ac-mouth" d="M100 116 v5 M100 121 q-7 5 -13 1 M100 121 q7 5 13 1" stroke="#c98aa6" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M78 108 q-14 4 -22 -2 M78 113 q-15 5 -24 1" stroke="#e7d9f5" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M122 108 q14 4 22 -2 M122 113 q15 5 24 1" stroke="#e7d9f5" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </svg>`;
}

// --- DRAGON: round teal dragon with gold horns + little wings (hatches later) ---
function dragonSVG() {
  return `
  <svg class="ac-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dragon">
    <ellipse class="ac-shadow" cx="100" cy="188" rx="54" ry="10"/>
    <g class="ac-body-group">
      <path class="ac-tail" d="M150 152 q42 6 30 46 q-2 -28 -30 -26 z" fill="#37b799"/>
      <path class="ac-ear-l" d="M58 116 q-36 -20 -46 6 q28 2 38 24 z" fill="#7fe3c8"/>
      <path class="ac-ear-r" d="M142 116 q36 -20 46 6 q-28 2 -38 24 z" fill="#7fe3c8"/>
      <ellipse class="ac-body" cx="100" cy="142" rx="56" ry="46" fill="#4ecfae"/>
      <ellipse cx="100" cy="158" rx="36" ry="26" fill="#d9f8ee"/>
      <path d="M84 152 h32 M84 164 h32" stroke="#c2f0e2" stroke-width="3" opacity="0.7"/>
      <rect x="66" y="170" width="20" height="20" rx="9" fill="#41bd9d"/>
      <rect x="114" y="170" width="20" height="20" rx="9" fill="#41bd9d"/>
      <g class="ac-head">
        <path d="M80 54 l-5 -20 l15 12 z" fill="#ffe08a"/>
        <path d="M120 54 l5 -20 l-15 12 z" fill="#ffe08a"/>
        <circle class="ac-headball" cx="100" cy="92" r="45" fill="#54d6b4"/>
        <ellipse cx="100" cy="112" rx="28" ry="20" fill="#eafaf4"/>
        <g class="ac-eye-l"><circle cx="85" cy="86" r="8" fill="#2a2a3a"/><circle cx="87" cy="83" r="2.5" fill="#fff"/></g>
        <g class="ac-eye-r"><circle cx="115" cy="86" r="8" fill="#2a2a3a"/><circle cx="117" cy="83" r="2.5" fill="#fff"/></g>
        <ellipse cx="92" cy="108" rx="3" ry="2.4" fill="#2f7d68"/>
        <ellipse cx="108" cy="108" rx="3" ry="2.4" fill="#2f7d68"/>
        <path class="ac-mouth" d="M88 114 q12 10 24 0" stroke="#2f7d68" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </svg>`;
}

// Ids of the three starter pets — the rest of the roster is unlocked in-game.
export const STARTER_IDS = ['dog', 'cat', 'unicorn'];

export const ANIMALS = [
  { id: 'dog', name: 'Biscuit', emoji: '🐶', svg: dogSVG() },
  { id: 'cat', name: 'Mochi', emoji: '🐱', svg: catSVG() },
  { id: 'unicorn', name: 'Sparkle', emoji: '🦄', svg: unicornSVG() },
  { id: 'bunny', name: 'Clover', emoji: '🐰', svg: bunnySVG() },
  { id: 'dragon', name: 'Ember', emoji: '🐉', svg: dragonSVG() },
];
