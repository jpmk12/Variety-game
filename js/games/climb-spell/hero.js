// The hero: an original masked climber kid. Our own colors (teal suit, orange
// gloves/boots) with a friendly star emblem — deliberately NOT Spider-Man (no
// web pattern, no spider symbol, no red/blue costume). Parts carry classes so
// css/styles.css can pose them for crawl / swing / cheer.

export const HERO_SVG = `
<svg class="cs-hero-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Climber hero">
  <g class="cs-hero-inner">
    <!-- arms (reaching up to climb) -->
    <g class="cs-arm cs-arm-l">
      <rect x="16" y="40" width="14" height="40" rx="7" fill="#2ec4b6"/>
      <circle cx="23" cy="40" r="9" fill="#ff8c42"/>
    </g>
    <g class="cs-arm cs-arm-r">
      <rect x="70" y="40" width="14" height="40" rx="7" fill="#2ec4b6"/>
      <circle cx="77" cy="40" r="9" fill="#ff8c42"/>
    </g>

    <!-- legs -->
    <g class="cs-leg cs-leg-l">
      <rect x="34" y="92" width="14" height="34" rx="7" fill="#2ec4b6"/>
      <ellipse cx="41" cy="124" rx="10" ry="7" fill="#ff8c42"/>
    </g>
    <g class="cs-leg cs-leg-r">
      <rect x="52" y="92" width="14" height="34" rx="7" fill="#2ec4b6"/>
      <ellipse cx="59" cy="124" rx="10" ry="7" fill="#ff8c42"/>
    </g>

    <!-- body -->
    <g class="cs-body">
      <ellipse cx="50" cy="72" rx="26" ry="28" fill="#2ec4b6"/>
      <ellipse cx="50" cy="76" rx="15" ry="17" fill="#3fd9cb"/>
      <!-- star emblem (NOT a spider) -->
      <path d="M50 62 l3.4 6.9 7.6 1.1 -5.5 5.4 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.4 7.6 -1.1z" fill="#ffd23f"/>
    </g>

    <!-- head with hood mask + eye lenses -->
    <g class="cs-head">
      <circle cx="50" cy="30" r="22" fill="#2ec4b6"/>
      <path d="M30 30 a20 20 0 0 1 40 0 q-20 10 -40 0z" fill="#28b3a6"/>
      <!-- eye lenses -->
      <path class="cs-eye cs-eye-l" d="M34 27 q-2 -8 9 -8 q6 0 6 7 q0 6 -8 6 q-6 0 -7 -5z" fill="#fff" stroke="#1c8a80" stroke-width="2"/>
      <path class="cs-eye cs-eye-r" d="M66 27 q2 -8 -9 -8 q-6 0 -6 7 q0 6 8 6 q6 0 7 -5z" fill="#fff" stroke="#1c8a80" stroke-width="2"/>
    </g>
  </g>
</svg>`;
