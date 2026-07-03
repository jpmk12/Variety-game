// Counting Market — a gentle numbers game. A pet comes to the stall and asks for
// a number of fruit ("3 apples, please!") shown as a numeral + counting dots and
// said out loud. Drag fruit from the bins into the basket (each one is counted),
// then tap "Give it!". Serve a whole day of customers to finish and level up.
// No fail state — a wrong count just gets a gentle "count again!".

import { ANIMALS, STARTER_IDS } from '../animal-care/animals.js';
import { play, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from '../samurai/speech.js';
import { load, save } from '../../storage.js';
import { award, unlockSticker } from '../../progress.js';
import { FRUITS, fruitById, makeOrder } from './orders.js';

const SAVE_KEY = 'counting-market';
const DAY_TARGET = 5;   // customers to serve for a full market day
const MAX_LEVEL = 4;    // Day 4 introduces addition ("a + b = ?")
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

const CUSTOMERS = ANIMALS.filter((a) => STARTER_IDS.includes(a.id));

export function mountCountingMarket(root) {
  const game = document.createElement('div');
  game.className = 'cm-game';
  game.innerHTML = `
    <div class="cm-stall">
      <div class="cm-awning" aria-hidden="true"></div>
      <div class="cm-top">
        <div class="cm-meter" aria-label="Customers served"><span class="cm-meter-fill"></span></div>
        <span class="cm-level"></span>
      </div>
      <div class="cm-customer">
        <span class="cm-cust-art" aria-hidden="true"></span>
        <div class="cm-order" role="status"></div>
      </div>
      <div class="cm-basket" aria-label="Basket"><div class="cm-basket-items"></div></div>
      <button class="cm-give">Give it! 🎁</button>
      <div class="cm-bins" role="group" aria-label="Fruit to pick"></div>
      <div class="cm-banner" role="status"></div>
    </div>
    <div class="cm-start">
      <div class="cm-start-card">
        <div class="cm-start-emoji" aria-hidden="true">🧺</div>
        <h2>Counting Market</h2>
        <p>Count out the fruit each customer asks for!</p>
        <button class="cm-start-btn">Open the Shop!</button>
      </div>
    </div>
  `;
  root.appendChild(game);

  const custArt = game.querySelector('.cm-cust-art');
  const orderEl = game.querySelector('.cm-order');
  const basketEl = game.querySelector('.cm-basket');
  const basketItemsEl = game.querySelector('.cm-basket-items');
  const giveBtn = game.querySelector('.cm-give');
  const binsEl = game.querySelector('.cm-bins');
  const meterFill = game.querySelector('.cm-meter-fill');
  const levelEl = game.querySelector('.cm-level');
  const banner = game.querySelector('.cm-banner');
  const startOverlay = game.querySelector('.cm-start');
  const startBtn = game.querySelector('.cm-start-btn');

  // --- state ---
  let level = Math.min(MAX_LEVEL, Math.max(1, (load(SAVE_KEY, {}) || {}).level | 0 || 1));
  let order = null;
  let customer = null;
  let basket = [];       // list of fruitIds in the basket
  let served = 0;
  let busy = false;      // ignore input during transitions
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const persist = () => save(SAVE_KEY, { level });

  // test hook
  game.__cm = {
    get order() { return order; },
    get basket() { return [...basket]; },
    get served() { return served; },
    get level() { return level; },
    start: () => start(),
    addItem: (id) => addItem(id),
    removeItem: (i) => removeItem(i),
    give: () => give(),
    setLevel: (n) => { level = n; renderLevel(); nextCustomer(); },
  };

  // --- day / customer flow ---
  function start() {
    unlock();
    startOverlay.classList.add('hidden');
    served = 0;
    setMeter();
    renderLevel();
    nextCustomer();
  }

  function nextCustomer() {
    busy = false;
    basket = [];
    customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    order = makeOrder(level);
    custArt.innerHTML = customer.svg;
    custArt.classList.remove('cm-arrive');
    void custArt.offsetWidth;
    custArt.classList.add('cm-arrive');
    renderOrder();
    renderBasket();
    renderBins();
    if (!isMuted()) later(() => speak(order.speak), 250);
  }

  function renderLevel() { levelEl.textContent = level > 1 ? `Day ${level}` : ''; }
  function setMeter() { meterFill.style.width = (served / DAY_TARGET) * 100 + '%'; }

  const dots = (n) => `<span class="cm-dots" aria-hidden="true">${'<span class="cm-dot"></span>'.repeat(n)}</span>`;
  const orderItem = (count, emoji) => `<span class="cm-order-item"><span class="cm-order-num">${count}</span><span class="cm-order-emoji">${emoji}</span>${dots(count)}</span>`;

  function renderOrder() {
    if (order.addition) {
      const { a, b, emoji } = order.addition;
      orderEl.innerHTML = `${orderItem(a, emoji)}<span class="cm-op">+</span>${orderItem(b, emoji)}<span class="cm-op cm-eq">= ?</span>`;
      return;
    }
    orderEl.innerHTML = order.sentence
      .map((s, i) => `${i > 0 ? '<span class="cm-and">and</span>' : ''}${orderItem(s.count, s.emoji)}`)
      .join('');
  }

  function renderBins() {
    binsEl.innerHTML = '';
    order.bins.forEach((id) => {
      const f = fruitById(id);
      const bin = document.createElement('button');
      bin.className = 'cm-bin';
      bin.dataset.id = id;
      bin.setAttribute('aria-label', 'Add ' + f.name);
      bin.innerHTML = `<span class="cm-bin-fruit" aria-hidden="true">${f.emoji}</span>`;
      makeDraggable(bin, id);
      binsEl.appendChild(bin);
    });
  }

  function renderBasket() {
    basketItemsEl.innerHTML = '';
    basket.forEach((id, idx) => {
      const chip = document.createElement('button');
      chip.className = 'cm-chip';
      chip.textContent = fruitById(id).emoji;
      chip.setAttribute('aria-label', 'Remove ' + fruitById(id).name);
      chip.addEventListener('click', () => removeItem(idx));
      basketItemsEl.appendChild(chip);
    });
    giveBtn.disabled = basket.length === 0;
  }

  // --- adding / removing fruit ---
  function addItem(id) {
    if (busy || !order) return;
    basket.push(id);
    renderBasket();
    // count of this fruit now in the basket, said out loud (one, two, three…)
    const n = basket.filter((x) => x === id).length;
    if (!isMuted()) speak(String(n));
    play('select');
    const chips = basketItemsEl.querySelectorAll('.cm-chip');
    const last = chips[chips.length - 1];
    if (last) { last.classList.add('pop'); }
  }

  function removeItem(i) {
    if (busy) return;
    basket.splice(i, 1);
    renderBasket();
    play('select');
  }

  // --- give it to the customer ---
  function give() {
    if (busy || !order) return;
    if (basket.length === 0) { nudge('Add some fruit!'); return; }
    if (isCorrect()) success();
    else nudge(basket.length < totalNeeded() ? 'A few more!' : 'Count again!');
  }

  function totalNeeded() { return order.items.reduce((s, it) => s + it.count, 0); }

  function isCorrect() {
    const counts = {};
    basket.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    for (const it of order.items) if ((counts[it.fruitId] || 0) !== it.count) return false;
    const orderIds = new Set(order.items.map((it) => it.fruitId));
    for (const id in counts) if (counts[id] > 0 && !orderIds.has(id)) return false;
    return true;
  }

  function nudge(msg) {
    showBanner(msg, false);
    play('oops');
    if (!isMuted()) speak('Count again');
  }

  function success() {
    busy = true;
    served += 1;
    setMeter();
    if (order.addition) unlockSticker('cm-add'); // solved an addition!
    play('point');
    custArt.classList.remove('cm-happy');
    void custArt.offsetWidth;
    custArt.classList.add('cm-happy');
    star();
    showBanner('Thank you! 😋', true);
    if (!isMuted()) speak('Thank you!');
    if (served >= DAY_TARGET) later(winDay, 1300);
    else later(nextCustomer, 1300);
  }

  function winDay() {
    busy = true;
    confetti();
    play('happy');
    const leveled = level < MAX_LEVEL;
    if (leveled) level += 1;
    persist();
    award({ stars: 3, counter: 'cmDays', stickers: ['cm-first'] });
    renderLevel();
    showBanner(leveled ? `Market day done! Day ${level} next 🎉` : 'Market day done! 🎉', true);
    if (!isMuted()) speak('Great shopping!');
    later(() => { served = 0; setMeter(); nextCustomer(); }, 2400);
  }

  function showBanner(msg, good) {
    banner.textContent = msg;
    banner.classList.toggle('is-good', !!good);
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    later(() => banner.classList.remove('show'), 1600);
  }

  function star() {
    const s = document.createElement('span');
    s.className = 'cm-star';
    s.textContent = '⭐';
    game.querySelector('.cm-stall').appendChild(s);
    later(() => s.remove(), 1000);
  }

  const CONFETTI = ['#ff6b9d', '#ffd166', '#2ec4b6', '#5ec8ff', '#bdb2ff', '#ff8c42'];
  function confetti() {
    const n = reduceMotion ? 10 : 26;
    const stall = game.querySelector('.cm-stall');
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'cm-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = CONFETTI[i % CONFETTI.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      stall.appendChild(c);
      later(() => c.remove(), 2400);
    }
  }

  // --- drag a fruit from a bin into the basket ---
  function makeDraggable(bin, fruitId) {
    const down = (e) => {
      if (busy) return;
      e.preventDefault();
      const ghost = document.createElement('span');
      ghost.className = 'cm-drag';
      ghost.textContent = fruitById(fruitId).emoji;
      document.body.appendChild(ghost);
      const at = (ev) => { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; };
      at(e);
      const move = (ev) => { ev.preventDefault(); at(ev); };
      const up = (ev) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        ghost.remove();
        const r = basketEl.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) addItem(fruitId);
      };
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up);
    };
    bin.addEventListener('pointerdown', down);
  }

  // --- listeners ---
  startBtn.addEventListener('click', start);
  giveBtn.addEventListener('click', give);

  return function unmount() {
    alive = false;
    cancelSpeech();
    timers.forEach(clearTimeout);
    game.remove();
  };
}
