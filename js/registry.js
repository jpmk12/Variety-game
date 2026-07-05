// Registry of games shown on the hub menu. Adding a new game later is just one
// entry here: give it an id/title/emoji and a mount(el) that renders into #app
// and returns an unmount() cleanup function. The hub renders cards automatically.

import { mountAnimalCare } from './games/animal-care/index.js';
import { mountSamurai } from './games/samurai/index.js';
import { mountClimbSpell } from './games/climb-spell/index.js';
import { mountBeatBuddies } from './games/beat-buddies/index.js';
import { mountCountingMarket } from './games/counting-market/index.js';
import { mountMemoryMatch } from './games/memory-match/index.js';
import { mountShapeSort } from './games/shape-sort/index.js';

export const games = [
  {
    id: 'animal-care',
    title: 'Animal Care',
    emoji: '🐾',
    blurb: 'Feed, wash and play with your pets!',
    accent: '#ffd166',
    thumb: 'assets/tiles/animal-care.png',
    mount: mountAnimalCare,
  },
  {
    id: 'samurai',
    title: 'Letter Samurai',
    emoji: '⚔️',
    blurb: 'Slash the letter you hear!',
    accent: '#8ecae6',
    thumb: 'assets/tiles/samurai.png',
    mount: mountSamurai,
  },
  {
    id: 'climb-spell',
    title: 'Climb & Spell',
    emoji: '🕸️',
    blurb: 'Climb and swing to spell words!',
    accent: '#2ec4b6',
    thumb: 'assets/tiles/climb-spell.png',
    mount: mountClimbSpell,
  },
  {
    id: 'beat-buddies',
    title: 'Beat Buddies',
    emoji: '🎵',
    blurb: 'Tap the animal band to the beat!',
    accent: '#ff6b9d',
    mount: mountBeatBuddies,
  },
  {
    id: 'counting-market',
    title: 'Counting Market',
    emoji: '🧺',
    blurb: 'Count out fruit for the customers!',
    accent: '#4cc38a',
    mount: mountCountingMarket,
  },
  {
    id: 'memory-match',
    title: 'Pet Pairs',
    emoji: '🃏',
    blurb: 'Flip cards to find matching pets!',
    accent: '#b298dc',
    mount: mountMemoryMatch,
  },
  {
    id: 'shape-sort',
    title: 'Shape Sorters',
    emoji: '🔺',
    blurb: 'Sort shapes and colors into bins!',
    accent: '#ff9f6b',
    mount: mountShapeSort,
  },
];
