// Multi-step "cinematics" for each care action so they feel like a real event
// rather than one wiggle. The controller plays the steps of SEQUENCES[actionId]
// in order; each step holds for `ms` and can:
//   art       – class on the pet's .ac-art (body motion)
//   overlay    – class(es) on the pet's effects overlay (suds/rinse/shine...)
//   prop       – true → pop the action's prop (bowl/ball) in
//   particle   – emoji to spray, with `count`
//   sound      – sound effect name to play at this step
//   say        – true → float the action's praise message
//   celebrate  – true → fire the celebration here (if the pet just got content)
//
// Bath is the showcase: lather up → scrub → rinse the suds away → sparkle clean.

export const SEQUENCES = {
  feed: [
    { ms: 600, art: 'lean-down', prop: true, sound: 'feed' },
    { ms: 1300, art: 'is-eating', particle: '🍖', count: 4 },
    { ms: 650, art: 'is-happy', particle: '❤️', count: 5, sound: 'happy', say: true, celebrate: true },
  ],
  water: [
    { ms: 600, art: 'lean-down', prop: true, sound: 'water' },
    { ms: 1200, art: 'is-drinking', particle: '💧', count: 3 },
    { ms: 750, art: 'is-shaking', particle: '💧', count: 6, sound: 'happy', say: true, celebrate: true },
  ],
  bath: [
    { ms: 1000, art: 'is-bathing', overlay: 'suds', sound: 'bath', particle: '🫧', count: 5 },
    { ms: 850, art: 'is-bathing', overlay: 'suds scrub', particle: '🫧', count: 3 },
    { ms: 1000, art: 'is-shaking', overlay: 'rinse', sound: 'water', particle: '💧', count: 6 },
    { ms: 900, art: 'is-shining', overlay: 'shine', particle: '✨', count: 7, sound: 'happy', say: true, celebrate: true },
  ],
  play: [
    { ms: 650, prop: true, sound: 'play' },
    { ms: 1200, art: 'is-playing', particle: '⭐', count: 4 },
    { ms: 800, art: 'is-happy', particle: '⭐', count: 6, sound: 'happy', say: true, celebrate: true },
  ],
};

// Every art-motion class a step can set (so the runner can clear the previous
// one before starting the next).
export const STEP_ART = [
  'lean-down', 'is-eating', 'is-drinking', 'is-bathing', 'is-playing',
  'is-shaking', 'is-shining', 'is-happy', 'is-full', 'is-cuddle', 'is-dancing',
];
