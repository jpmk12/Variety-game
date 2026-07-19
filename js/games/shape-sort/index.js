// Shape Sorters — a sorting/logic game. One item (a colored shape) appears; tap
// the bin it belongs in. The rule changes by level: sort by shape (ignore the
// color) or by color (ignore the shape). Sort a whole day's worth to win and
// level up. No timer, no losing — a wrong tap just gives a gentle "try again".

import { play, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from '../samurai/speech.js';
import { load, save } from '../../storage.js';
import { award, unlockSticker } from '../../progress.js';
import { shapeSVG, colorHex, shapeName, levelCfg, makeRound, MAX_LEVEL } from './shapes.js';

const SAVE_KEY = 'shape-sort';
const DAY_TARGET = 6;   // items to sort for a full day
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountShapeSort(root) {
  const game = document.createElement('div');
  game.className = 'ss-game';
  game.innerHTML = `
    <div class="ss-stage">
      <div class="ss-top">
        <div class="ss-meter" aria-label="Sorted so far"><span class="ss-meter-fill"></span></div>
        <span class="ss-level"></span>
      </div>
      <p class="ss-rule" role="status"></p>
      <div class="ss-item-wrap"><div class="ss-item" aria-live="polite"></div></div>
      <div class="ss-bins" role="group" aria-label="Sorting bins"></div>
      <div class="ss-banner" role="status"></div>
    </div>
    <div class="ss-start">
      <div class="ss-start-card">
        <div class="ss-start-emoji" aria-hidden="true">🔺</div>
        <h2>Shape Sorters</h2>
        <p>Tap the bin where each one belongs!</p>
        <button class="ss-start-btn">Start Sorting!</button>
      </div>
    </div>
  `;
  root.appendChild(game);

  const meterFill = game.querySelector('.ss-meter-fill');
  const levelEl = game.querySelector('.ss-level');
  const ruleEl = game.querySelector('.ss-rule');
  const itemEl = game.querySelector('.ss-item');
  const binsEl = game.querySelector('.ss-bins');
  const banner = game.querySelector('.ss-banner');
  const startOverlay = game.querySelector('.ss-start');
  const startBtn = game.querySelector('.ss-start-btn');

  // --- state ---
  let level = Math.min(MAX_LEVEL, Math.max(1, (load(SAVE_KEY, {}) || {}).level | 0 || 1));
  let round = null;
  let sorted = 0;
  let busy = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const persist = () => save(SAVE_KEY, { level });

  // test hook
  game.__ss = {
    get level() { return level; },
    get sorted() { return sorted; },
    get target() { return DAY_TARGET; },
    get round() { return round && { sortBy: round.sortBy, bins: [...round.bins], answer: round.answer, item: { ...round.item } }; },
    get busy() { return busy; },
    start: () => start(),
    tap: (binId) => tapBin(binId),
    setLevel: (n) => { level = Math.min(MAX_LEVEL, Math.max(1, n)); persist(); startDay(); },
  };

  function start() { unlock(); startOverlay.classList.add('hidden'); startDay(); }

  function startDay() {
    sorted = 0;
    busy = false;
    setMeter();
    renderLevel();
    renderRule(true);
    nextItem();
  }

  function renderLevel() { levelEl.textContent = level > 1 ? `Level ${level}` : ''; }
  function setMeter() { meterFill.style.width = (sorted / DAY_TARGET) * 100 + '%'; }

  function renderRule(announce) {
    const by = levelCfg(level).sortBy;
    ruleEl.textContent = by === 'color' ? 'Sort by color! 🎨' : 'Sort by shape! 🔷';
    if (announce && !isMuted()) later(() => speak(by === 'color' ? 'Sort by color' : 'Sort by shape'), 250);
  }

  function nextItem() {
    busy = false;
    round = makeRound(level);
    itemEl.innerHTML = shapeSVG(round.item.shape, colorHex(round.item.color));
    itemEl.classList.remove('ss-drop');
    void itemEl.offsetWidth;
    itemEl.classList.add('ss-drop');
    renderBins();
  }

  function renderBins() {
    binsEl.innerHTML = '';
    binsEl.style.setProperty('--bins', round.bins.length);
    round.bins.forEach((binId) => {
      const bin = document.createElement('button');
      bin.className = 'ss-bin';
      bin.dataset.bin = binId;
      // Shape bins show a neutral outline of the shape; color bins show a paint blob.
      const icon = round.sortBy === 'color'
        ? shapeSVG('circle', colorHex(binId))
        : shapeSVG(binId, '#cfc8e6');
      const label = round.sortBy === 'color'
        ? binId[0].toUpperCase() + binId.slice(1)
        : shapeName(binId);
      bin.innerHTML = `<span class="ss-bin-icon" aria-hidden="true">${icon}</span><span class="ss-bin-label">${label}</span>`;
      bin.setAttribute('aria-label', 'Put it in ' + label);
      bin.addEventListener('click', () => tapBin(binId));
      binsEl.appendChild(bin);
    });
  }

  function tapBin(binId) {
    if (busy || !round) return;
    const bin = binsEl.querySelector(`.ss-bin[data-bin="${binId}"]`);
    if (binId === round.answer) {
      busy = true;
      sorted += 1;
      setMeter();
      play('point');
      if (bin) { bin.classList.add('ss-bin-yay'); }
      itemEl.classList.add('ss-into');
      if (sorted >= DAY_TARGET) later(winDay, 700);
      else later(nextItem, 620);
    } else {
      // gentle miss — wobble the wrong bin, keep going
      play('oops');
      if (bin) { bin.classList.remove('ss-bin-no'); void bin.offsetWidth; bin.classList.add('ss-bin-no'); }
      showBanner('Try again!', false);
    }
  }

  function winDay() {
    busy = true;
    confetti();
    play('happy');
    const byColor = levelCfg(level).sortBy === 'color';
    const leveled = level < MAX_LEVEL;
    if (leveled) level += 1;
    persist();
    award({ stars: 3, counter: 'ssDays', stickers: ['ss-first'] });
    if (byColor) unlockSticker('ss-color');
    renderLevel();
    // At the top level it's "endless" — every finished day is a mastery lap.
    showBanner(leveled ? `All sorted! Level ${level} next 🎉` : '⭐ Sort Master! Endless mode! ⭐', true);
    if (!isMuted()) speak(leveled ? 'Great sorting!' : 'Sort master!');
    later(startDay, 2400);
  }

  function showBanner(msg, good) {
    banner.textContent = msg;
    banner.classList.toggle('is-good', !!good);
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    later(() => banner.classList.remove('show'), 1500);
  }

  const CONFETTI = ['#ff6b9d', '#ffd166', '#2ec4b6', '#5ec8ff', '#bdb2ff', '#ff8c42'];
  function confetti() {
    const n = reduceMotion ? 10 : 26;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'ss-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = CONFETTI[i % CONFETTI.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      game.querySelector('.ss-stage').appendChild(c);
      later(() => c.remove(), 2400);
    }
  }

  startBtn.addEventListener('click', start);

  return function unmount() {
    cancelSpeech();
    timers.forEach(clearTimeout);
    game.remove();
  };
}
