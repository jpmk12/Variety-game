// Renders the game-selection menu from the registry. Tapping a playable card
// asks main.js to launch that game. A header shows the ⭐ star wallet and opens
// the Sticker Book; each card shows how many of its stickers you've collected.

import { games } from './registry.js';
import { getStars, groupProgress } from './progress.js';
import { renderStickerBook } from './stickerbook.js';
import { renderProfileMenu } from './profilemenu.js';
import { getActive } from './profiles.js';
import { status as dailyStatus } from './daily.js';
import { renderDailyModal } from './daily-modal.js';
import { play } from './audio.js';

// The daily treat pops up only on the first hub render of an app load, so it
// doesn't nag every time you back out of a game or the sticker book.
let dailyChecked = false;

// Which sticker group each game contributes to (for the per-card progress hint).
const GAME_GROUP = {
  'animal-care': 'Animal Care',
  'samurai': 'Letter Samurai',
  'climb-spell': 'Climb & Spell',
  'beat-buddies': 'Beat Buddies',
  'counting-market': 'Counting Market',
  'memory-match': 'Pet Pairs',
  'shape-sort': 'Shape Sorters',
};

export function renderHub(container, onLaunch) {
  container.innerHTML = '';

  const hub = document.createElement('div');
  hub.className = 'hub';

  const me = getActive();
  const header = document.createElement('div');
  header.className = 'hub-header';
  header.innerHTML = `
    <button class="hub-profile-btn" aria-label="Switch player">
      <span class="hub-profile-avatar" aria-hidden="true">${me.avatar}</span>
      <span class="hub-profile-name">${me.name}</span>
    </button>
    <div class="hub-stars" aria-label="Stars earned">⭐ <span class="hub-stars-n">${getStars()}</span></div>
    <button class="hub-book-btn" aria-label="Open sticker book">📖 Sticker Book</button>
  `;
  header.querySelector('.hub-book-btn').addEventListener('click', () => {
    play('select');
    renderStickerBook(container, () => renderHub(container, onLaunch));
  });
  header.querySelector('.hub-profile-btn').addEventListener('click', () => {
    play('select');
    renderProfileMenu(container, () => renderHub(container, onLaunch));
  });
  hub.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'hub-grid';

  games.forEach((game) => {
    const card = document.createElement('button');
    card.className = 'game-card' + (game.comingSoon ? ' is-soon' : '');
    card.style.setProperty('--accent', game.accent || '#ffd166');
    card.disabled = !!game.comingSoon;
    card.setAttribute('aria-label', game.title);

    // A generated hero image if the game has one, otherwise the emoji.
    const art = game.thumb
      ? `<span class="game-thumb" style="background-image:url(${game.thumb})" aria-hidden="true"></span>`
      : `<span class="game-emoji" aria-hidden="true">${game.emoji}</span>`;

    // Sticker progress badge for playable games that map to a group.
    const group = GAME_GROUP[game.id];
    let progressBadge = '';
    if (group) {
      const { got, total } = groupProgress(group);
      progressBadge = `<span class="game-progress" aria-label="${got} of ${total} stickers">🏅 ${got}/${total}</span>`;
    }

    card.innerHTML = `
      ${art}
      <span class="game-title">${game.title}</span>
      <span class="game-blurb">${game.blurb || ''}</span>
      ${progressBadge}
      ${game.comingSoon ? '<span class="soon-badge">Coming soon</span>' : ''}
    `;

    if (!game.comingSoon) {
      card.addEventListener('click', () => onLaunch(game));
    }

    grid.appendChild(card);
  });

  hub.appendChild(grid);
  container.appendChild(hub);

  // First render of this load: offer today's daily treat if it's unclaimed.
  if (!dailyChecked) {
    dailyChecked = true;
    if (!dailyStatus().claimedToday) {
      renderDailyModal(container, () => {
        const n = hub.querySelector('.hub-stars-n');
        if (n) n.textContent = getStars();
      });
    }
  }
}
