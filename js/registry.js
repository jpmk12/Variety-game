// Registry of games shown on the hub menu. Adding a new game later is just one
// entry here: give it an id/title/emoji and a mount(el) that renders into #app
// and returns an unmount() cleanup function. The hub renders cards automatically.

import { mountAnimalCare } from './games/animal-care/index.js';
import { mountSamurai } from './games/samurai/index.js';
import { mountClimbSpell } from './games/climb-spell/index.js';

export const games = [
  {
    id: 'animal-care',
    title: 'Animal Care',
    emoji: '🐾',
    blurb: 'Feed, wash and play with your pets!',
    accent: '#ffd166',
    mount: mountAnimalCare,
  },
  {
    id: 'samurai',
    title: 'Letter Samurai',
    emoji: '⚔️',
    blurb: 'Slash the letter you hear!',
    accent: '#8ecae6',
    mount: mountSamurai,
  },
  {
    id: 'climb-spell',
    title: 'Climb & Spell',
    emoji: '🕸️',
    blurb: 'Climb and swing to spell words!',
    accent: '#2ec4b6',
    mount: mountClimbSpell,
  },
  // Placeholder slot proves the menu scales to more games.
  {
    id: 'coming-soon',
    title: 'More Soon',
    emoji: '✨',
    blurb: 'New games are on the way!',
    accent: '#bdb2ff',
    comingSoon: true,
  },
];
