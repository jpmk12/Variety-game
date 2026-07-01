// The four care actions. Each defines its button look, the CSS class that drives
// the animal's animation, the sound effect, the particle to spray, how it
// restores stats, the `primary` need it satisfies (used to detect "already
// full"), and the praise/full-up messages shown as feedback. Adding an action
// later is just one entry here.

export const ACTIONS = [
  {
    id: 'feed',
    label: 'Feed',
    emoji: '🍖',
    accent: '#ff9f68',
    sound: 'feed',
    anim: 'is-eating',
    particle: '❤️',
    primary: 'hunger',
    praise: 'Yum yum!',
    fullMessage: "I'm full!",
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
    primary: 'thirst',
    praise: 'Slurp!',
    fullMessage: 'Not thirsty!',
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
    primary: 'cleanliness',
    praise: 'Squeaky clean!',
    fullMessage: 'All clean!',
    restore: { cleanliness: 80, happiness: 12 },
  },
  {
    id: 'brush',
    label: 'Brush',
    emoji: '🪮',
    accent: '#c9b6ff',
    sound: 'brush',
    anim: 'is-brushing',
    particle: '✨',
    primary: 'tidy',
    praise: 'So fluffy!',
    fullMessage: 'All neat!',
    // Grooming makes the coat neat and shiny (and feels nice).
    restore: { tidy: 80, happiness: 10 },
  },
  {
    id: 'play',
    label: 'Play',
    emoji: '🎾',
    accent: '#ffd166',
    sound: 'play',
    anim: 'is-playing',
    particle: '⭐',
    primary: 'happiness',
    praise: 'Wheee!',
    fullMessage: 'So happy!',
    // Playing is the biggest happiness boost (and burns a little energy).
    restore: { happiness: 45, hunger: -5, energy: -5 },
  },
  {
    id: 'nighttime',
    label: 'Night',
    emoji: '🌙',
    accent: '#8a8de0',
    sound: 'night',
    anim: 'is-sleeping',
    particle: '💤',
    primary: 'energy',
    praise: 'All rested!',
    fullMessage: 'Not sleepy!',
    // A good sleep refills energy and leaves the pet content.
    restore: { energy: 95, happiness: 8 },
  },
];
