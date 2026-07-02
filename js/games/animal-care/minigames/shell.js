// Shared shell + helpers for the Animal Care mini-games. Every task uses the
// same chrome: a back button, a title, the pet on a stage, an effects layer,
// a hint line, and a goal meter that — when full — celebrates and calls onWin.

import { play, playVoice } from '../../../audio.js';
import { stickerById } from '../../../stickers.js';

export const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// Create the shell inside `host`. Returns handles the mini-game drives.
export function createShell(host, opts) {
  const el = document.createElement('div');
  el.className = 'ac-mini';
  el.style.setProperty('--mg', opts.color || '#ffd166');
  el.innerHTML = `
    <div class="ac-mini-top">
      <button class="ac-mini-back" aria-label="Back to pet">←</button>
      <span class="ac-mini-title">${opts.icon} ${opts.title}</span>
      <span class="ac-mini-goal">
        <span class="ac-mini-goal-icon" aria-hidden="true">${opts.meterIcon || '⭐'}</span>
        <span class="ac-mini-track"><span class="ac-mini-fill"></span></span>
      </span>
    </div>
    <div class="ac-mini-stage">
      <div class="ac-mini-pet">${opts.pet.svg}</div>
      <div class="ac-mini-fx" aria-hidden="true"></div>
      <div class="ac-mini-hint"></div>
      <div class="ac-mini-banner" role="status"></div>
    </div>
  `;
  host.appendChild(el);

  const fill = el.querySelector('.ac-mini-fill');
  const stage = el.querySelector('.ac-mini-stage');
  const petEl = el.querySelector('.ac-mini-pet');
  const fx = el.querySelector('.ac-mini-fx');
  const hintEl = el.querySelector('.ac-mini-hint');
  const banner = el.querySelector('.ac-mini-banner');

  let progress = 0;
  let won = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

  function setProgress(p) {
    progress = Math.max(0, Math.min(1, p));
    fill.style.width = (progress * 100) + '%';
    if (progress >= 1 && !won) win();
  }
  function setHint(text) { hintEl.textContent = text; }

  function win() {
    won = true;
    petEl.classList.add('mg-win');
    banner.textContent = opts.winPraise || 'Yay!';
    banner.classList.add('show');
    hintEl.textContent = '';
    confetti(fx, reduceMotion ? 10 : 26);
    play('happy');
    if (opts.petId) later(() => playVoice(opts.petId), 160);
    // Pay out the reward (stars, bond, stickers) and show what was earned.
    const reward = opts.onReward ? opts.onReward() : null;
    if (reward) showReward(reward);
    later(() => opts.onWin(), reward && reward.newStickers.length ? 2300 : 1600);
  }

  // A little chip that pops under the banner: "+3 ⭐", a level-up heart, and a
  // "New sticker!" callout for anything freshly unlocked.
  function showReward(r) {
    const box = document.createElement('div');
    box.className = 'ac-mini-reward';
    const bits = [];
    if (r.stars) bits.push(`<span class="ac-reward-stars">+${r.stars} ⭐</span>`);
    if (r.leveledUp) bits.push(`<span class="ac-reward-level">❤️ Friends Lv ${r.level}!</span>`);
    box.innerHTML = bits.join('');
    for (const id of r.newStickers) {
      const s = stickerById(id);
      if (!s) continue;
      const chip = document.createElement('div');
      chip.className = 'ac-reward-sticker';
      chip.innerHTML = `<span class="ac-reward-badge">${s.emoji}</span> New sticker: <b>${s.name}</b>!`;
      box.appendChild(chip);
    }
    stage.appendChild(box);
    requestAnimationFrame(() => box.classList.add('show'));
    if (r.newStickers.length) play('point');
  }

  el.querySelector('.ac-mini-back').addEventListener('click', () => opts.onBack());

  // expose a test hook
  el.__mg = { get progress() { return progress; }, get won() { return won; }, forceWin: () => setProgress(1) };

  return {
    el, stage, petEl, fx, banner, later,
    setProgress, setHint,
    bump: (d) => setProgress(progress + d),
    get progress() { return progress; },
    isWon: () => won,
    cleanup() { timers.forEach(clearTimeout); el.remove(); },
  };
}

// Track a pointer "rub/paint" over `el`; calls handler(x, y, phase) with coords
// as 0..1 fractions of the element. phase is 'down' | 'move' | 'up'.
export function onDrag(el, handler) {
  let down = false;
  const pos = (e) => {
    const r = el.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const d = (e) => { down = true; const p = pos(e); handler(p.x, p.y, 'down'); };
  const m = (e) => { if (!down) return; e.preventDefault(); const p = pos(e); handler(p.x, p.y, 'move'); };
  const u = () => { if (!down) return; down = false; handler(0, 0, 'up'); };
  el.addEventListener('pointerdown', d);
  window.addEventListener('pointermove', m, { passive: false });
  window.addEventListener('pointerup', u);
  return () => {
    el.removeEventListener('pointerdown', d);
    window.removeEventListener('pointermove', m);
    window.removeEventListener('pointerup', u);
  };
}

// Drag a single item; onDrop(x, y) gets stage-fraction coords, return true to
// consume it (otherwise it springs back).
export function dragItem(itemEl, stage, onDrop) {
  let sx = 0, sy = 0, dragging = false;
  const move = (e) => { if (!dragging) return; e.preventDefault(); itemEl.style.transform = `translate(${e.clientX - sx}px, ${e.clientY - sy}px) scale(1.15)`; };
  const up = (e) => {
    if (!dragging) return;
    dragging = false;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    itemEl.classList.remove('dragging');
    const r = stage.getBoundingClientRect();
    const consumed = onDrop((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    itemEl.style.transform = consumed ? 'scale(0)' : '';
  };
  const down = (e) => {
    dragging = true; sx = e.clientX; sy = e.clientY;
    itemEl.classList.add('dragging');
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
  };
  itemEl.addEventListener('pointerdown', down);
  return () => { itemEl.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
}

// A small positioned "spot" (dirt, suds, tuft…) inside a layer.
export function spot(cls, xFrac, yFrac) {
  const el = document.createElement('span');
  el.className = cls;
  el.style.left = (xFrac * 100) + '%';
  el.style.top = (yFrac * 100) + '%';
  return { el, x: xFrac, y: yFrac, done: false };
}

const CONFETTI = ['#ff6b9d', '#ffd166', '#2ec4b6', '#5ec8ff', '#bdb2ff', '#ff8c42'];
export function confetti(layer, n) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement('span');
    c.className = 'ac-mini-confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = CONFETTI[i % CONFETTI.length];
    c.style.animationDelay = Math.random() * 0.4 + 's';
    c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
    layer.appendChild(c);
    setTimeout(() => c.remove(), 2400);
  }
}
