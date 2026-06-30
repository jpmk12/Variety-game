// The four care actions. Each defines its button look, the CSS class that drives
// the animal's animation, the sound effect, the particle to spray, and how it
// restores stats. Adding an action later is just one entry here.

export const ACTIONS = [
  {
    id: 'feed',
    label: 'Feed',
    emoji: '🍖',
    accent: '#ff9f68',
    sound: 'feed',
    anim: 'is-eating',
    particle: '❤️',
    // Eating fills the tummy and brings a little joy.
    restore: { hunger: 60, happiness: 15 },
  },
  {
    id: 'water',
    label: 'Water',
    emoji: '💧',
    accent: '#5ec8ff',
    sound: 'water',
    anim: 'is-drinking',
    particle: '💧',
    restore: { thirst: 70, happiness: 10 },
  },
  {
    id: 'bath',
    label: 'Bath',
    emoji: '🛁',
    accent: '#9be7c4',
    sound: 'bath',
    anim: 'is-bathing',
    particle: '🫧',
    restore: { cleanliness: 80, happiness: 12 },
  },
  {
    id: 'play',
    label: 'Play',
    emoji: '🎾',
    accent: '#ffd166',
    sound: 'play',
    anim: 'is-playing',
    particle: '⭐',
    // Playing is the biggest happiness boost (and burns a little energy).
    restore: { happiness: 45, hunger: -5 },
  },
];
