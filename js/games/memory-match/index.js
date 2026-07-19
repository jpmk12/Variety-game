// Pet Pairs — a memory / matching game. Cards start face-down (paw-print backs);
// flip two at a time to find matching pet faces. A match stays up with a happy
// wiggle + that pet's voice; a mismatch gently flips back. Clear the whole board
// to win, earn stars, and level up to a bigger grid. No timer, no losing.

import { play, playVoice, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from '../samurai/speech.js';
import { load, save } from '../../storage.js';
import { award, unlockSticker } from '../../progress.js';
import { buildDeck, deckInfo, MAX_LEVEL } from './deck.js';

const SAVE_KEY = 'memory-match';
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;
const FLIP_BACK = reduceMotion ? 550 : 900;  // how long a mismatched pair stays up

export function mountMemoryMatch(root) {
  const game = document.createElement('div');
  game.className = 'mm-game';
  game.innerHTML = `
    <div class="mm-stage">
      <div class="mm-top">
        <span class="mm-level"></span>
        <span class="mm-found" aria-label="Pairs found">🐾 0/0</span>
      </div>
      <div class="mm-grid" role="group" aria-label="Memory cards"></div>
      <div class="mm-banner" role="status"></div>
    </div>
    <div class="mm-start">
      <div class="mm-start-card">
        <div class="mm-start-emoji" aria-hidden="true">🃏</div>
        <h2>Pet Pairs</h2>
        <p>Flip the cards to find matching pets!</p>
        <div class="mm-modes" role="group" aria-label="Game mode">
          <button class="mm-mode" data-mode="faces">🐾 Faces</button>
          <button class="mm-mode" data-mode="names">🔤 Names</button>
        </div>
        <button class="mm-start-btn">Play! 🐾</button>
      </div>
    </div>
  `;
  root.appendChild(game);

  const gridEl = game.querySelector('.mm-grid');
  const levelEl = game.querySelector('.mm-level');
  const foundEl = game.querySelector('.mm-found');
  const banner = game.querySelector('.mm-banner');
  const startOverlay = game.querySelector('.mm-start');
  const startBtn = game.querySelector('.mm-start-btn');
  const modeBtns = game.querySelectorAll('.mm-mode');

  // --- state ---
  const saved = load(SAVE_KEY, {}) || {};
  let level = Math.min(MAX_LEVEL, Math.max(1, saved.level | 0 || 1));
  let mode = saved.mode === 'names' ? 'names' : 'faces';
  let deck = [];
  let flipped = [];          // indices currently face-up and unmatched
  const matched = new Set(); // indices that have been paired off
  let wrongFlips = 0;
  let started = false;
  let busy = false;          // ignore taps during a mismatch flip-back
  let won = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const persist = () => save(SAVE_KEY, { level, mode });

  // test hook — deck order is exposed so tests can flip known pairs deterministically
  game.__mm = {
    get level() { return level; },
    get mode() { return mode; },
    get found() { return matched.size / 2; },
    get total() { return deck.length / 2; },
    get won() { return won; },
    get busy() { return busy; },
    get deck() { return deck.map((c, i) => ({ i, key: c.key, animalId: c.animalId, kind: c.kind, matched: matched.has(i), up: flipped.includes(i) })); },
    start: () => start(),
    flip: (i) => flip(i),
    setMode: (m) => { mode = m === 'names' ? 'names' : 'faces'; syncModeBtns(); persist(); if (started) deal(); },
    setLevel: (n) => { level = Math.min(MAX_LEVEL, Math.max(1, n)); persist(); deal(); },
  };

  function syncModeBtns() {
    modeBtns.forEach((b) => b.classList.toggle('is-on', b.dataset.mode === mode));
  }

  // --- deal a fresh board ---
  function start() {
    unlock();
    startOverlay.classList.add('hidden');
    started = true;
    deal();
  }

  function deal() {
    won = false;
    busy = false;
    flipped = [];
    matched.clear();
    wrongFlips = 0;
    deck = buildDeck(level, mode);
    renderLevel();
    renderGrid();
    renderFound();
  }

  function renderLevel() { levelEl.textContent = level > 1 ? `Level ${level}` : ''; }
  function renderFound() { foundEl.textContent = `🐾 ${matched.size / 2}/${deck.length / 2}`; }

  function renderGrid() {
    const { cols } = deckInfo(level, mode);
    gridEl.style.setProperty('--cols', cols);
    gridEl.innerHTML = '';
    deck.forEach((card, i) => {
      const btn = document.createElement('button');
      btn.className = 'mm-card';
      btn.dataset.i = i;
      btn.setAttribute('aria-label', 'Card');
      // A name card shows the pet's species word (Dog/Cat); a face card its art.
      const face = card.kind === 'name'
        ? `<span class="mm-word">${card.species || card.name}</span>`
        : `${card.svg}${card.accessory ? `<span class="mm-acc" aria-hidden="true">${card.accessory}</span>` : ''}`;
      btn.innerHTML = `
        <span class="mm-card-inner">
          <span class="mm-back" aria-hidden="true">🐾</span>
          <span class="mm-front" aria-hidden="true">${face}</span>
        </span>`;
      btn.addEventListener('click', () => flip(i));
      gridEl.appendChild(btn);
    });
  }

  const cardEl = (i) => gridEl.querySelector(`.mm-card[data-i="${i}"]`);

  // --- the flip / match loop ---
  function flip(i) {
    if (!started || busy || won) return;
    const card = deck[i];
    if (!card || matched.has(i) || flipped.includes(i)) return;

    setUp(i, true);
    play('select');
    flipped.push(i);
    if (flipped.length < 2) return;

    const [a, b] = flipped;
    if (deck[a].key === deck[b].key) {
      // a match — lock both up
      matched.add(a); matched.add(b);
      flipped = [];
      setMatched(a); setMatched(b);
      playVoice(deck[a].animalId);
      renderFound();
      if (matched.size === deck.length) later(win, 650);
    } else {
      // no match — flip both back after a beat
      busy = true;
      wrongFlips += 1;
      play('oops');
      later(() => {
        setUp(a, false); setUp(b, false);
        flipped = [];
        busy = false;
      }, FLIP_BACK);
    }
  }

  function setUp(i, up) {
    const el = cardEl(i);
    if (el) el.classList.toggle('is-up', up);
  }
  function setMatched(i) {
    const el = cardEl(i);
    if (el) { el.classList.add('is-up', 'is-matched'); }
  }

  // --- win the board ---
  function win() {
    won = true;
    busy = true;
    confetti();
    play('happy');
    // A matched pet gets a little friendship for the win.
    const pet = deck.length ? deck[0].animalId : 'dog';
    award({ stars: 3, counter: 'mmWins', bondPet: pet, bondXp: 1, stickers: ['mm-first'] });
    if (wrongFlips === 0) unlockSticker('mm-perfect');   // cleared with no wrong flips!
    if (mode === 'names') unlockSticker('mm-names');     // matched pets to their names!
    const leveled = level < MAX_LEVEL;
    if (leveled) level += 1;
    persist();
    showBanner(
      wrongFlips === 0 ? 'Perfect memory! 🌟'
        : leveled ? `You win! Level ${level} next 🎉`
          : 'You win! 🎉',
      true,
    );
    if (!isMuted()) speak('You found them all!');
    later(deal, 2600);
  }

  function showBanner(msg, good) {
    banner.textContent = msg;
    banner.classList.toggle('is-good', !!good);
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    later(() => banner.classList.remove('show'), 2200);
  }

  const CONFETTI = ['#ff6b9d', '#ffd166', '#2ec4b6', '#5ec8ff', '#bdb2ff', '#ff8c42'];
  function confetti() {
    const n = reduceMotion ? 10 : 28;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'mm-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = CONFETTI[i % CONFETTI.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      game.querySelector('.mm-stage').appendChild(c);
      later(() => c.remove(), 2400);
    }
  }

  modeBtns.forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode === 'names' ? 'names' : 'faces';
    syncModeBtns();
    persist();
    play('select');
  }));
  syncModeBtns();
  startBtn.addEventListener('click', start);

  return function unmount() {
    cancelSpeech();
    timers.forEach(clearTimeout);
    game.remove();
  };
}
