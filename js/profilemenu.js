// "Who's playing?" screen — pick a kid profile or make a new one. Each profile
// keeps its own pets, stars, and stickers (saves are namespaced in storage.js).
// Switching just flips the active id and reloads so every module re-reads its
// data under the new profile.

import { getProfiles, getActiveId, setActive, addProfile, canAddProfile,
         PROFILE_AVATARS } from './profiles.js';
import { play } from './audio.js';

export function renderProfileMenu(container, onBack) {
  const activeId = getActiveId();

  const wrap = document.createElement('div');
  wrap.className = 'profile-menu';
  wrap.innerHTML = `
    <div class="pm-top">
      <button class="pm-back" aria-label="Back to menu">← Menu</button>
      <h2 class="pm-title">Who's playing?</h2>
      <span class="pm-spacer"></span>
    </div>
    <div class="pm-grid"></div>
  `;

  const grid = wrap.querySelector('.pm-grid');

  getProfiles().forEach((p) => {
    const card = document.createElement('button');
    card.className = 'pm-card' + (p.id === activeId ? ' is-active' : '');
    card.dataset.id = p.id;
    card.setAttribute('aria-label', 'Play as ' + p.name);
    card.innerHTML = `
      <span class="pm-avatar" aria-hidden="true">${p.avatar}</span>
      <span class="pm-name">${p.name}</span>
      ${p.id === activeId ? '<span class="pm-badge">Playing</span>' : ''}
    `;
    card.addEventListener('click', () => {
      play('select');
      if (p.id === activeId) { onBack(); return; }
      setActive(p.id);
      // Reload so progress.js / audio.js / every game re-read the new profile.
      location.reload();
    });
    grid.appendChild(card);
  });

  if (canAddProfile()) {
    const add = document.createElement('button');
    add.className = 'pm-card pm-add';
    add.setAttribute('aria-label', 'Add a new player');
    add.innerHTML = `
      <span class="pm-avatar" aria-hidden="true">➕</span>
      <span class="pm-name">New Player</span>
    `;
    add.addEventListener('click', () => { play('select'); showCreate(); });
    grid.appendChild(add);
  }

  // The "make a new profile" flow — name + avatar picker, swapped in place.
  function showCreate() {
    let chosen = PROFILE_AVATARS[0];
    const form = document.createElement('div');
    form.className = 'pm-create';
    form.innerHTML = `
      <p class="pm-create-hint">Pick a name and a buddy!</p>
      <input class="pm-name-input" type="text" maxlength="12" placeholder="Name"
             aria-label="Player name" autocomplete="off" />
      <div class="pm-avatars" role="group" aria-label="Pick an avatar"></div>
      <div class="pm-create-actions">
        <button class="pm-cancel">Cancel</button>
        <button class="pm-save">Let's play!</button>
      </div>
    `;

    const avatars = form.querySelector('.pm-avatars');
    PROFILE_AVATARS.forEach((a, i) => {
      const b = document.createElement('button');
      b.className = 'pm-avatar-pick' + (i === 0 ? ' is-picked' : '');
      b.textContent = a;
      b.setAttribute('aria-label', 'Avatar ' + a);
      b.addEventListener('click', () => {
        chosen = a;
        avatars.querySelectorAll('.pm-avatar-pick').forEach((x) => x.classList.remove('is-picked'));
        b.classList.add('is-picked');
        play('pop');
      });
      avatars.appendChild(b);
    });

    form.querySelector('.pm-cancel').addEventListener('click', () => {
      play('select');
      renderProfileMenu(container, onBack);
    });
    form.querySelector('.pm-save').addEventListener('click', () => {
      const name = form.querySelector('.pm-name-input').value;
      const created = addProfile(name, chosen);
      play('win');
      if (created) location.reload();
      else renderProfileMenu(container, onBack);
    });

    wrap.innerHTML = '';
    const top = document.createElement('div');
    top.className = 'pm-top';
    top.innerHTML = `<button class="pm-back" aria-label="Back">← Back</button><h2 class="pm-title">New Player</h2><span class="pm-spacer"></span>`;
    top.querySelector('.pm-back').addEventListener('click', () => {
      play('select');
      renderProfileMenu(container, onBack);
    });
    wrap.appendChild(top);
    wrap.appendChild(form);
    form.querySelector('.pm-name-input').focus();
  }

  wrap.querySelector('.pm-back').addEventListener('click', () => { play('select'); onBack(); });

  container.innerHTML = '';
  container.appendChild(wrap);
}
