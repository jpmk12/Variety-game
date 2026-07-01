// Renders the game-selection menu from the registry. Tapping a playable card
// asks main.js to launch that game.

import { games } from './registry.js';

export function renderHub(container, onLaunch) {
  container.innerHTML = '';

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

    card.innerHTML = `
      ${art}
      <span class="game-title">${game.title}</span>
      <span class="game-blurb">${game.blurb || ''}</span>
      ${game.comingSoon ? '<span class="soon-badge">Coming soon</span>' : ''}
    `;

    if (!game.comingSoon) {
      card.addEventListener('click', () => onLaunch(game));
    }

    grid.appendChild(card);
  });

  container.appendChild(grid);
}
