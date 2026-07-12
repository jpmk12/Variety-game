// Word Builders — a construction-themed spelling game. A word is laid out as
// concrete slots; scattered letter blocks sit around the site. Drag each block
// (a magnet-crane follows your finger) into its matching slot to build the word.
// A wrong slot bounces the block back — no timer, no losing. Build a few words
// to finish the "site" and level up to longer words with fewer hints.

import { play, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from '../samurai/speech.js';
import { load, save } from '../../storage.js';
import { award, unlockSticker } from '../../progress.js';
import { makePuzzle, levelCfg, MAX_LEVEL } from './words.js';

const SAVE_KEY = 'word-builders';
const WORDS_PER_SITE = 3;   // words to build for a full site → level up
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountWordBuilders(root) {
  const game = document.createElement('div');
  game.className = 'wb-game';
  game.innerHTML = `
    <div class="wb-site">
      <div class="wb-top">
        <div class="wb-meter" aria-label="Words built"><span class="wb-meter-fill"></span></div>
        <span class="wb-level"></span>
      </div>
      <button class="wb-say" aria-label="Say the word again">🔊</button>
      <div class="wb-slots" role="group" aria-label="Word to build"></div>
      <div class="wb-blocks" role="group" aria-label="Letter blocks"></div>
      <div class="wb-banner" role="status"></div>
    </div>
    <div class="wb-start">
      <div class="wb-start-card">
        <div class="wb-start-emoji" aria-hidden="true">🏗️</div>
        <h2>Word Builders</h2>
        <p>Move the letters to build the word!</p>
        <button class="wb-start-btn">Start Building!</button>
      </div>
    </div>
  `;
  root.appendChild(game);

  const meterFill = game.querySelector('.wb-meter-fill');
  const levelEl = game.querySelector('.wb-level');
  const sayBtn = game.querySelector('.wb-say');
  const slotsEl = game.querySelector('.wb-slots');
  const blocksEl = game.querySelector('.wb-blocks');
  const banner = game.querySelector('.wb-banner');
  const startOverlay = game.querySelector('.wb-start');
  const startBtn = game.querySelector('.wb-start-btn');

  // --- state ---
  let level = Math.min(MAX_LEVEL, Math.max(1, (load(SAVE_KEY, {}) || {}).level | 0 || 1));
  let puzzle = null;
  let slots = [];   // [{ expected, filled }]
  let blocks = [];  // [{ letter, used }]
  let built = 0;    // words built this site
  let prevWord = null;
  let busy = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const persist = () => save(SAVE_KEY, { level });

  // test hook
  game.__wb = {
    get level() { return level; },
    get word() { return puzzle && puzzle.word; },
    get hint() { return !!(puzzle && puzzle.hint); },
    get slots() { return slots.map((s) => ({ expected: s.expected, filled: s.filled })); },
    get blocks() { return blocks.map((b, i) => ({ i, letter: b.letter, used: b.used })); },
    get built() { return built; },
    get done() { return slots.length > 0 && slots.every((s) => s.filled); },
    get busy() { return busy; },
    start: () => start(),
    place: (bi, si) => placeLetter(bi, si),
    setLevel: (n) => { level = Math.min(MAX_LEVEL, Math.max(1, n)); persist(); nextWord(); },
  };

  function start() { unlock(); startOverlay.classList.add('hidden'); built = 0; setMeter(); renderLevel(); nextWord(); }

  function renderLevel() { levelEl.textContent = level > 1 ? `Level ${level}` : ''; }
  function setMeter() { meterFill.style.width = (built / WORDS_PER_SITE) * 100 + '%'; }

  function nextWord() {
    busy = false;
    puzzle = makePuzzle(level, prevWord);
    prevWord = puzzle.word;
    slots = puzzle.letters.map((ch) => ({ expected: ch, filled: false }));
    blocks = puzzle.blocks.map((ch) => ({ letter: ch, used: false }));
    renderSlots();
    renderBlocks();
    if (!isMuted()) later(() => speak(puzzle.word), 300);
  }

  function renderSlots() {
    slotsEl.innerHTML = '';
    slots.forEach((s, i) => {
      const slot = document.createElement('div');
      slot.className = 'wb-slot' + (s.filled ? ' is-filled' : '');
      slot.dataset.slot = i;
      // A hint shows the target letter faintly engraved in the concrete.
      slot.innerHTML = s.filled
        ? `<span class="wb-slot-letter">${s.expected}</span>`
        : (puzzle.hint ? `<span class="wb-slot-hint">${s.expected}</span>` : '');
      slotsEl.appendChild(slot);
    });
  }

  function renderBlocks() {
    blocksEl.innerHTML = '';
    blocks.forEach((b, i) => {
      const el = document.createElement('button');
      el.className = 'wb-block' + (b.used ? ' is-used' : '');
      el.dataset.block = i;
      el.textContent = b.letter;
      el.setAttribute('aria-label', 'Letter ' + b.letter);
      if (!b.used) makeDraggable(el, i);
      blocksEl.appendChild(el);
    });
  }

  // Try to place block bi into slot si.
  function placeLetter(bi, si) {
    if (busy) return false;
    const b = blocks[bi];
    const s = slots[si];
    if (!b || !s || b.used || s.filled) return false;
    if (b.letter === s.expected) {
      b.used = true;
      s.filled = true;
      play('point');
      if (!isMuted()) speak(b.letter);
      renderSlots();
      renderBlocks();
      if (slots.every((x) => x.filled)) later(winWord, 550);
      return true;
    }
    // wrong slot — gentle bounce
    play('oops');
    const slotEl = slotsEl.querySelector(`.wb-slot[data-slot="${si}"]`);
    if (slotEl) { slotEl.classList.remove('wb-slot-no'); void slotEl.offsetWidth; slotEl.classList.add('wb-slot-no'); }
    return false;
  }

  function winWord() {
    busy = true;
    const noHint = !puzzle.hint;
    award({ stars: 2, counter: 'wbWords', stickers: ['wb-first'] });
    if (noHint) unlockSticker('wb-nohint');
    play('happy');
    confetti();
    if (!isMuted()) speak(puzzle.word);
    built += 1;
    setMeter();
    if (built >= WORDS_PER_SITE) {
      const leveled = level < MAX_LEVEL;
      if (leveled) level += 1;
      persist();
      renderLevel();
      showBanner(leveled ? `Site done! Level ${level} next 🎉` : 'Site done! 🎉', true);
      later(() => { built = 0; setMeter(); nextWord(); }, 2400);
    } else {
      showBanner('You built it! 🔨', true);
      later(nextWord, 1600);
    }
  }

  function showBanner(msg, good) {
    banner.textContent = msg;
    banner.classList.toggle('is-good', !!good);
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    later(() => banner.classList.remove('show'), 1500);
  }

  const CONFETTI = ['#ffd166', '#ff8c42', '#f4a259', '#5ec8ff', '#bdb2ff', '#2ec4b6'];
  function confetti() {
    const n = reduceMotion ? 10 : 24;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'wb-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = CONFETTI[i % CONFETTI.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      game.querySelector('.wb-site').appendChild(c);
      later(() => c.remove(), 2400);
    }
  }

  // Drag a letter block; a magnet-crane hook follows the finger. On release,
  // drop it into whatever slot is under the pointer.
  function makeDraggable(el, blockIndex) {
    const down = (e) => {
      if (busy || blocks[blockIndex].used) return;
      e.preventDefault();
      const ghost = document.createElement('span');
      ghost.className = 'wb-drag';
      ghost.innerHTML = `<span class="wb-drag-hook" aria-hidden="true">🧲</span><span class="wb-drag-block">${blocks[blockIndex].letter}</span>`;
      document.body.appendChild(ghost);
      el.classList.add('is-lifting');
      const at = (ev) => { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; };
      at(e);
      const move = (ev) => { ev.preventDefault(); at(ev); highlight(ev); };
      const up = (ev) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        ghost.remove();
        el.classList.remove('is-lifting');
        clearHighlight();
        const si = slotAt(ev);
        if (si != null) placeLetter(blockIndex, si);
      };
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up);
    };
    el.addEventListener('pointerdown', down);
  }

  function slotAt(ev) {
    let found = null;
    slotsEl.querySelectorAll('.wb-slot').forEach((slot) => {
      const r = slot.getBoundingClientRect();
      if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
        found = Number(slot.dataset.slot);
      }
    });
    return found;
  }
  function highlight(ev) {
    const si = slotAt(ev);
    slotsEl.querySelectorAll('.wb-slot').forEach((slot) => {
      slot.classList.toggle('is-target', Number(slot.dataset.slot) === si && !slots[Number(slot.dataset.slot)].filled);
    });
  }
  function clearHighlight() { slotsEl.querySelectorAll('.wb-slot').forEach((s) => s.classList.remove('is-target')); }

  sayBtn.addEventListener('click', () => { if (puzzle && !isMuted()) speak(puzzle.word); play('select'); });
  startBtn.addEventListener('click', start);

  return function unmount() {
    cancelSpeech();
    timers.forEach(clearTimeout);
    game.remove();
  };
}
