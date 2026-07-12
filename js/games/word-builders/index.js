// Word Builders — a construction-themed spelling game. A word is laid out as
// concrete slots; scattered letter blocks sit around the site. There are two fun
// ways to install a letter:
//   • CRANE — tap a block and the gantry crane slides over, lowers, clamps it,
//     and lifts; then tap a slot and the crane carries it over and drops it in.
//   • DRAG — grab a block and drag it straight into a slot (it dangles from the
//     hook as you go).
// A wrong slot bounces the block back — no timer, no losing. Build a few words to
// finish the "site" and level up to longer words with fewer hints.

import { play, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from '../samurai/speech.js';
import { load, save } from '../../storage.js';
import { award, unlockSticker } from '../../progress.js';
import { makePuzzle, levelCfg, MAX_LEVEL } from './words.js';

const SAVE_KEY = 'word-builders';
const WORDS_PER_SITE = 3;   // words to build for a full site → level up
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;
const REST_CABLE = 18;      // resting cable length (px)

export function mountWordBuilders(root) {
  const game = document.createElement('div');
  game.className = 'wb-game';
  game.innerHTML = `
    <div class="wb-site">
      <div class="wb-crane" aria-hidden="true">
        <div class="wb-gantry-leg l"></div>
        <div class="wb-gantry-leg r"></div>
        <div class="wb-gantry-beam"></div>
        <div class="wb-trolley">
          <div class="wb-trolley-box"></div>
          <div class="wb-cable"></div>
          <div class="wb-hook"><span class="wb-magnet">🧲</span><span class="wb-held"></span></div>
        </div>
      </div>
      <div class="wb-top">
        <div class="wb-meter" aria-label="Words built"><span class="wb-meter-fill"></span></div>
        <span class="wb-level"></span>
      </div>
      <div class="wb-goal">
        <div class="wb-blueprint" aria-label="Word to build">
          <span class="wb-blueprint-tag">BUILD</span>
          <span class="wb-blueprint-word"></span>
        </div>
        <button class="wb-say" aria-label="Say the word again">🔊</button>
      </div>
      <div class="wb-slots" role="group" aria-label="Word to build"></div>
      <div class="wb-blocks" role="group" aria-label="Letter blocks"></div>
      <div class="wb-banner" role="status"></div>
    </div>
    <div class="wb-start">
      <div class="wb-start-card">
        <div class="wb-start-emoji" aria-hidden="true">🏗️</div>
        <h2>Word Builders</h2>
        <p>Tap a letter for the crane, or drag it — build the word!</p>
        <button class="wb-start-btn">Start Building!</button>
      </div>
    </div>
  `;
  root.appendChild(game);

  const site = game.querySelector('.wb-site');
  const meterFill = game.querySelector('.wb-meter-fill');
  const levelEl = game.querySelector('.wb-level');
  const sayBtn = game.querySelector('.wb-say');
  const slotsEl = game.querySelector('.wb-slots');
  const blocksEl = game.querySelector('.wb-blocks');
  const banner = game.querySelector('.wb-banner');
  const startOverlay = game.querySelector('.wb-start');
  const startBtn = game.querySelector('.wb-start-btn');
  const blueprintWordEl = game.querySelector('.wb-blueprint-word');
  const beam = game.querySelector('.wb-gantry-beam');
  const trolley = game.querySelector('.wb-trolley');
  const cable = game.querySelector('.wb-cable');
  const hook = game.querySelector('.wb-hook');
  const heldEl = game.querySelector('.wb-held');

  // --- state ---
  let level = Math.min(MAX_LEVEL, Math.max(1, (load(SAVE_KEY, {}) || {}).level | 0 || 1));
  let puzzle = null;
  let slots = [];   // [{ expected, filled }]
  let blocks = [];  // [{ letter, used }]
  let built = 0;    // words built this site
  let prevWord = null;
  let busy = false;
  let held = null;      // block index the crane is holding, or null
  let craneBusy = false; // a crane move is animating
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const wait = (ms) => new Promise((res) => later(res, ms));
  const persist = () => save(SAVE_KEY, { level });

  // test hook
  game.__wb = {
    get level() { return level; },
    get word() { return puzzle && puzzle.word; },
    get hint() { return !!(puzzle && puzzle.hint); },
    get slots() { return slots.map((s) => ({ expected: s.expected, filled: s.filled })); },
    get blocks() { return blocks.map((b, i) => ({ i, letter: b.letter, used: b.used })); },
    get built() { return built; },
    get held() { return held; },
    get done() { return slots.length > 0 && slots.every((s) => s.filled); },
    get busy() { return busy; },
    get craneBusy() { return craneBusy; },
    start: () => start(),
    place: (bi, si) => placeLetter(bi, si),
    cranePick: (bi) => cranePick(bi),
    cranePlace: (si) => cranePlace(si),
    setLevel: (n) => { level = Math.min(MAX_LEVEL, Math.max(1, n)); persist(); nextWord(); },
  };

  function start() { unlock(); startOverlay.classList.add('hidden'); built = 0; setMeter(); renderLevel(); parkCrane(); nextWord(); }

  function renderLevel() { levelEl.textContent = level > 1 ? `Level ${level}` : ''; }
  function setMeter() { meterFill.style.width = (built / WORDS_PER_SITE) * 100 + '%'; }

  function nextWord() {
    busy = false; held = null; craneBusy = false;
    hideHeld();
    puzzle = makePuzzle(level, prevWord);
    prevWord = puzzle.word;
    slots = puzzle.letters.map((ch) => ({ expected: ch, filled: false }));
    blocks = puzzle.blocks.map((ch) => ({ letter: ch, used: false }));
    // Always show the word to build, so kids know their goal.
    blueprintWordEl.textContent = puzzle.word.split('').join(' ');
    renderSlots();
    renderBlocks();
    parkCrane();
    if (!isMuted()) later(() => speak(puzzle.word), 300);
  }

  function renderSlots() {
    slotsEl.innerHTML = '';
    slots.forEach((s, i) => {
      const slot = document.createElement('div');
      slot.className = 'wb-slot' + (s.filled ? ' is-filled' : '');
      slot.dataset.slot = i;
      // Empty slots are letter-shaped molds carved into the concrete, so the row
      // reads as the word and the crane pulls each block into its matching form.
      slot.innerHTML = s.filled
        ? `<span class="wb-slot-letter">${s.expected}</span>`
        : `<span class="wb-slot-mold">${s.expected}</span>`;
      // tap a slot while the crane holds a letter → drop it here
      slot.addEventListener('pointerdown', () => { if (held != null) cranePlace(i); });
      slotsEl.appendChild(slot);
    });
  }

  function renderBlocks() {
    blocksEl.innerHTML = '';
    blocks.forEach((b, i) => {
      const el = document.createElement('button');
      // a held block hides from the tray (it's up on the crane hook)
      const hidden = b.used || i === held;
      el.className = 'wb-block' + (hidden ? ' is-used' : '');
      el.dataset.block = i;
      el.textContent = b.letter;
      el.setAttribute('aria-label', 'Letter ' + b.letter);
      if (!hidden) makeInteractive(el, i);
      blocksEl.appendChild(el);
    });
  }

  // Try to place block bi into slot si. Returns true if it fit.
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

  // ---- the crane ----
  // The rail floats just above the slot row, wherever that lands, so it always
  // lines up regardless of the blueprint sign or screen size.
  function beamY() {
    const s = site.getBoundingClientRect();
    const r = slotsEl.getBoundingClientRect();
    return Math.max(40, (r.top - s.top) - 32);
  }
  const railTop = () => beamY() + 14;   // y of the hook's rest point
  function rel(el) {
    const s = site.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2 - s.left, cy: r.top + r.height / 2 - s.top };
  }
  function parkCrane() {
    const y = beamY();
    beam.style.top = y + 'px';
    trolley.style.top = y + 'px';
    trolley.style.left = (site.clientWidth / 2) + 'px';
    cable.style.height = REST_CABLE + 'px';
  }
  function showHeld(letter) { heldEl.textContent = letter; heldEl.classList.add('show'); }
  function hideHeld() { heldEl.textContent = ''; heldEl.classList.remove('show'); }

  const T_MOVE = reduceMotion ? 0 : 460;
  const T_DROP = reduceMotion ? 0 : 400;
  const trolleyTo = async (cx) => { trolley.style.left = cx + 'px'; await wait(T_MOVE); };
  const dropTo = async (cy) => { cable.style.height = Math.max(6, cy - railTop()) + 'px'; await wait(T_DROP); };
  const liftUp = async () => { cable.style.height = REST_CABLE + 'px'; await wait(T_DROP); };

  async function cranePick(bi) {
    if (busy || craneBusy || held != null) return false;
    const el = blocksEl.querySelector(`.wb-block[data-block="${bi}"]`);
    if (!el || !blocks[bi] || blocks[bi].used) return false;
    craneBusy = true;
    const p = rel(el);
    await trolleyTo(p.cx);
    await dropTo(p.cy);
    // clamp on
    held = bi;
    showHeld(blocks[bi].letter);
    renderBlocks();          // hide the tray block now it's on the hook
    hook.classList.add('is-loaded');
    play('select');
    await liftUp();
    craneBusy = false;
    return true;
  }

  async function cranePlace(si) {
    if (busy || craneBusy || held == null) return false;
    const el = slotsEl.querySelector(`.wb-slot[data-slot="${si}"]`);
    if (!el) return false;
    craneBusy = true;
    const bi = held;
    const p = rel(el);
    await trolleyTo(p.cx);
    await dropTo(p.cy);
    const ok = placeLetter(bi, si);
    if (ok) { held = null; hideHeld(); hook.classList.remove('is-loaded'); }
    // if it didn't fit, keep holding it and try another slot
    await liftUp();
    craneBusy = false;
    return ok;
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

  // A block accepts a quick TAP (→ crane picks it up) or a DRAG (→ carry it
  // straight to a slot, dangling from a hook).
  function makeInteractive(el, bi) {
    const down = (e) => {
      if (busy || craneBusy || held != null || blocks[bi].used) return;
      e.preventDefault();
      const start = { x: e.clientX, y: e.clientY };
      let dragging = false, ghost = null;
      const move = (ev) => {
        const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        if (!dragging && Math.hypot(dx, dy) > 8) {
          dragging = true;
          ghost = document.createElement('span');
          ghost.className = 'wb-drag';
          ghost.innerHTML = `<span class="wb-drag-hook" aria-hidden="true">🧲</span><span class="wb-drag-block">${blocks[bi].letter}</span>`;
          document.body.appendChild(ghost);
          el.classList.add('is-lifting');
        }
        if (dragging) { ev.preventDefault(); ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; highlight(ev); }
      };
      const up = (ev) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (dragging) {
          ghost.remove();
          el.classList.remove('is-lifting');
          clearHighlight();
          const si = slotAt(ev);
          if (si != null) placeLetter(bi, si);
        } else {
          cranePick(bi);   // a tap → let the crane do it
        }
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
