// Maps an action id to its mini-game. Each mount(host, ctx) renders the game and
// returns a cleanup fn. ctx = { pet, onWin, onBack }.

import { mountFeed } from './feed.js';
import { mountWater } from './water.js';
import { mountBath } from './bath.js';
import { mountBrush } from './brush.js';
import { mountPlay } from './play.js';
import { mountNight } from './night.js';

export const MINIGAMES = {
  feed: mountFeed,
  water: mountWater,
  bath: mountBath,
  brush: mountBrush,
  play: mountPlay,
  nighttime: mountNight,
};
