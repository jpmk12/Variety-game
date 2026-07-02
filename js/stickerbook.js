// The Sticker Book — a collection screen kids can flip through to see every
// reward they've earned (bright + named) and everything still to unlock (a
// mystery card with a "how to earn it" hint). Reached from the hub.

import { STICKERS, GROUPS } from './stickers.js';
import { getStickers, getStars } from './progress.js';
import { play } from './audio.js';

export function renderStickerBook(container, onBack) {
  const owned = getStickers();
  const earned = STICKERS.filter((s) => owned[s.id]).length;

  const wrap = document.createElement('div');
  wrap.className = 'sticker-book';
  wrap.innerHTML = `
    <div class="sb-top">
      <button class="sb-back" aria-label="Back to menu">← Menu</button>
      <h2 class="sb-title">📖 Sticker Book</h2>
      <span class="sb-stars">⭐ ${getStars()}</span>
    </div>
    <p class="sb-progress">${earned} of ${STICKERS.length} stickers collected</p>
    <div class="sb-groups"></div>
  `;

  const groupsEl = wrap.querySelector('.sb-groups');
  GROUPS.forEach((g) => {
    const list = STICKERS.filter((s) => s.group === g);
    if (!list.length) return;
    const got = list.filter((s) => owned[s.id]).length;

    const sec = document.createElement('section');
    sec.className = 'sb-group';
    sec.innerHTML = `<h3 class="sb-group-title">${g} <span class="sb-group-count">${got}/${list.length}</span></h3><div class="sb-grid"></div>`;
    const grid = sec.querySelector('.sb-grid');

    list.forEach((s) => {
      const has = !!owned[s.id];
      const card = document.createElement('div');
      card.className = 'sb-sticker' + (has ? ' is-earned' : ' is-locked');
      card.innerHTML = `
        <span class="sb-emoji" aria-hidden="true">${has ? s.emoji : '❓'}</span>
        <span class="sb-name">${has ? s.name : '???'}</span>
        <span class="sb-hint">${s.hint}</span>
      `;
      grid.appendChild(card);
    });
    groupsEl.appendChild(sec);
  });

  wrap.querySelector('.sb-back').addEventListener('click', () => { play('select'); onBack(); });

  container.innerHTML = '';
  container.appendChild(wrap);
}
