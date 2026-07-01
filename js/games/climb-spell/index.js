// Climb & Spell — a wall-climbing, web-swinging spelling game. The masked hero
// moves between letter perches by CRAWLING (near) or SWINGING (far, on a web
// line). The game says "Crawl/Swing to C!"; reaching the right letters in order
// spells a word. Wrong picks are gentle (no penalty). DOM + SVG, rAF movement.

import { play, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from '../samurai/speech.js';
import { pickWord, distractors } from './words.js';
import { HERO_SVG } from './hero.js';
import { ENEMIES, ENEMY_BONUS } from './enemies.js';

const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function mountClimbSpell(root) {
  const game = document.createElement('div');
  game.className = 'cs-game';
  game.innerHTML = `
    <div class="cs-wall">
      <svg class="cs-web-layer" aria-hidden="true"><line class="cs-web" x1="0" y1="0" x2="0" y2="0"/></svg>
      <div class="cs-prompt">
        <span class="cs-prompt-text">Get ready!</span>
        <button class="cs-say" aria-label="Say it again">🔊</button>
      </div>
      <div class="cs-score" aria-label="Score">🕸️ <span class="cs-score-n">0</span></div>
      <div class="cs-perches"></div>
      <div class="cs-enemies" aria-hidden="true"></div>
      <div class="cs-hero">${HERO_SVG}</div>
      <div class="cs-fx" aria-hidden="true"></div>
      <div class="cs-cheer" role="status" aria-live="polite"></div>
    </div>
    <div class="cs-wordbar"></div>
    <div class="cs-start">
      <div class="cs-start-card">
        <div class="cs-start-emoji" aria-hidden="true">🕸️</div>
        <h2>Climb &amp; Spell</h2>
        <p>Listen, then climb or swing to the letter!</p>
        <button class="cs-start-btn">Tap to Start</button>
      </div>
    </div>
  `;
  root.appendChild(game);

  const wall = game.querySelector('.cs-wall');
  const perchLayer = game.querySelector('.cs-perches');
  const enemyLayer = game.querySelector('.cs-enemies');
  const scoreN = game.querySelector('.cs-score-n');
  const heroEl = game.querySelector('.cs-hero');
  const webLine = game.querySelector('.cs-web');
  const fxLayer = game.querySelector('.cs-fx');
  const cheerEl = game.querySelector('.cs-cheer');
  const promptText = game.querySelector('.cs-prompt-text');
  const sayBtn = game.querySelector('.cs-say');
  const wordBar = game.querySelector('.cs-wordbar');
  const startOverlay = game.querySelector('.cs-start');
  const startBtn = game.querySelector('.cs-start-btn');

  // --- state ---
  let W = 0, H = 0;
  let perches = [];       // { id, xPct, yPct, letter, reachable, type, isTarget, el, letterEl }
  let current = 0;        // current perch id
  let word = '';
  let prevWord = null;
  let progress = 0;       // next letter index to reach
  let instruction = 'crawl';
  let targetId = -1;
  let started = false;
  let moving = false;
  let alive = true;
  let rafId = 0;
  let heroDir = 1;
  let score = 0;
  let activeEnemy = null;   // only one baddie on the wall at a time
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

  // test hook
  game.__game = {
    get word() { return word; },
    get progress() { return progress; },
    get current() { return current; },
    get instruction() { return instruction; },
    get targetId() { return targetId; },
    get score() { return score; },
    get enemyId() { return activeEnemy ? activeEnemy.dataset.eid : null; },
    spawnEnemy: () => spawnEnemy(),
    perchState: () => perches.map((p) => ({ id: p.id, letter: p.letter, reachable: p.reachable, isTarget: p.isTarget })),
  };

  // --- geometry ---
  function fit() {
    const r = wall.getBoundingClientRect();
    W = r.width; H = r.height;
    const svg = game.querySelector('.cs-web-layer');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    if (perches.length) placeHeroAtPerch(current);
  }
  const perchPx = (p) => ({ x: (p.xPct / 100) * W, y: (p.yPct / 100) * H });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const curPerch = () => perches.find((p) => p.id === current);

  function heroSize() { return { w: heroEl.offsetWidth || 70, h: heroEl.offsetHeight || 90 }; }
  function place(x, y, rot = 0) {
    const { w, h } = heroSize();
    heroEl.style.transform = `translate(${x - w / 2}px, ${y - h * 0.5}px) rotate(${rot}deg) scaleX(${heroDir})`;
  }
  function placeHeroAtPerch(id) {
    const p = perches.find((q) => q.id === id);
    if (p) { const { x, y } = perchPx(p); place(x, y, 0); }
  }
  const handPoint = (x, y) => ({ x, y: y - heroSize().h * 0.28 });

  // --- layout a fresh wall ---
  function layout() {
    perches.forEach((p) => p.el && p.el.remove());
    perches = [];
    const rows = 4, cols = 3;
    let id = 0;
    for (let rI = 0; rI < rows; rI++) {
      const y = 86 - rI * (66 / (rows - 1)); // bottom (86%) up to top (20%)
      for (let c = 0; c < cols; c++) {
        const baseX = 22 + c * 28; // 22, 50, 78
        perches.push({
          id: id++,
          xPct: clamp(baseX + (Math.random() * 2 - 1) * 8, 12, 88),
          yPct: clamp(y + (Math.random() * 2 - 1) * 5, 14, 90),
          letter: '', reachable: false, type: null, isTarget: false, el: null, letterEl: null,
        });
      }
    }
    // hero starts on the lowest perch
    current = perches.reduce((a, b) => (b.yPct > a.yPct ? b : a)).id;
    buildPerchEls();
    placeHeroAtPerch(current);
  }

  function buildPerchEls() {
    for (const p of perches) {
      const btn = document.createElement('button');
      btn.className = 'cs-perch';
      btn.dataset.id = p.id;
      btn.style.left = p.xPct + '%';
      btn.style.top = p.yPct + '%';
      btn.innerHTML = `<span class="cs-perch-letter"></span>`;
      btn.addEventListener('click', () => onPerchTap(p));
      perchLayer.appendChild(btn);
      p.el = btn;
      p.letterEl = btn.querySelector('.cs-perch-letter');
    }
  }

  // --- reachability from the current perch ---
  function computeReachable() {
    const cpx = perchPx(curPerch());
    const ranked = perches
      .filter((p) => p.id !== current)
      .map((p) => ({ p, d: dist(cpx, perchPx(p)) }))
      .sort((a, b) => a.d - b.d);
    perches.forEach((p) => { p.reachable = false; p.type = null; });
    const crawlMax = H * 0.32, swingMax = H * 0.62;
    let count = 0;
    for (const { p, d } of ranked) {
      if (count >= 5) break;
      if (d <= swingMax) { p.reachable = true; p.type = d <= crawlMax ? 'crawl' : 'swing'; count++; }
    }
    // guarantee a few choices even if the hero is cornered
    if (count < 3) {
      for (const { p, d } of ranked) {
        if (!p.reachable) { p.reachable = true; p.type = d <= crawlMax ? 'crawl' : 'swing'; count++; if (count >= 3) break; }
      }
    }
  }

  // --- set up the next letter to find ---
  function step() {
    const targetLetter = word[progress];
    computeReachable();
    const reach = perches.filter((p) => p.reachable);
    const above = reach.filter((p) => p.yPct < curPerch().yPct);
    const pool = above.length ? above : reach;
    const targetP = pool[Math.floor(Math.random() * pool.length)];
    targetId = targetP.id;
    instruction = targetP.type;

    // target letter on the target perch; distinct distractors everywhere else
    const others = perches.filter((p) => p !== targetP);
    const ds = distractors(targetLetter, [], others.length);
    others.forEach((p, i) => { p.letter = ds[i] || '?'; p.isTarget = false; });
    targetP.letter = targetLetter;
    targetP.isTarget = true;

    renderPerches();
    announce();
  }

  function renderPerches() {
    for (const p of perches) {
      p.letterEl.textContent = p.letter;
      p.el.classList.toggle('is-reachable', p.reachable);
      p.el.classList.toggle('is-current', p.id === current);
    }
  }

  function announce() {
    const letter = word[progress];
    promptText.innerHTML = `${cap(instruction)} to <b>${letter}</b>!`;
    if (!isMuted()) speak(`${instruction} to ${letter}`);
  }

  // --- movement ---
  function updateWeb(from, to) {
    webLine.setAttribute('x1', from.x); webLine.setAttribute('y1', from.y);
    webLine.setAttribute('x2', to.x); webLine.setAttribute('y2', to.y);
    webLine.classList.add('show');
  }
  function clearWeb() { webLine.classList.remove('show'); }

  // SWING: thwip a web to a fixed high anchor, pendulum across (the hero hangs
  // and leans along the web), then release onto the target.
  function animateSwing(from, to, resolve) {
    heroDir = 1;
    const dur = reduceMotion ? 240 : 1000;
    const anchor = { x: from.x * 0.35 + to.x * 0.65, y: Math.min(from.y, to.y) - H * 0.34 };
    const ctrl = { x: anchor.x, y: anchor.y + H * 0.16 };
    play('thwip');
    heroEl.classList.add('is-swinging');
    const start = performance.now();
    const frame = (now) => {
      if (!alive) return resolve();
      const t = Math.min(1, (now - start) / dur);
      if (t < 0.16) {                    // thwip: line shoots out to the anchor
        const g = t / 0.16;
        const hand = handPoint(from.x, from.y);
        updateWeb(hand, { x: hand.x + (anchor.x - hand.x) * g, y: hand.y + (anchor.y - hand.y) * g });
        place(from.x, from.y, 0);
      } else if (t < 0.9) {              // swing along the arc, hanging from the web
        const e = easeInOut((t - 0.16) / 0.74);
        const mt = 1 - e;
        const x = mt * mt * from.x + 2 * mt * e * ctrl.x + e * e * to.x;
        const y = mt * mt * from.y + 2 * mt * e * ctrl.y + e * e * to.y;
        const rot = clamp(Math.atan2(x - anchor.x, y - anchor.y) * 180 / Math.PI, -34, 34);
        updateWeb(handPoint(x, y), anchor);
        place(x, y, rot);
      } else {                           // release + settle onto the perch
        const e = (t - 0.9) / 0.1;
        clearWeb();
        place(to.x, to.y - (1 - e) * 8, 0);
      }
      if (t < 1) { rafId = requestAnimationFrame(frame); }
      else { clearWeb(); heroEl.classList.remove('is-swinging'); place(to.x, to.y, 0); resolve(); }
    };
    rafId = requestAnimationFrame(frame);
  }

  // CRAWL: scuttle along a gently wavy path with a climbing gait + lean.
  function animateCrawl(from, to, resolve) {
    heroDir = to.x < from.x ? -1 : 1;
    const dur = reduceMotion ? 220 : 750;
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;             // path normal
    const amp = Math.min(20, len * 0.09);
    play('crawl');
    heroEl.classList.add('is-crawling');
    const start = performance.now();
    const frame = (now) => {
      if (!alive) return resolve();
      const t = Math.min(1, (now - start) / dur);
      const e = easeInOut(t);
      const wobble = Math.sin(e * Math.PI * 2) * amp * (1 - e * 0.3);
      const x = from.x + dx * e + nx * wobble;
      const y = from.y + dy * e + ny * wobble + Math.sin(e * Math.PI) * -6;
      const rot = heroDir * 4 + Math.sin(e * Math.PI * 5) * 3;
      place(x, y, rot);
      if (t < 1) { rafId = requestAnimationFrame(frame); }
      else { heroEl.classList.remove('is-crawling'); place(to.x, to.y, 0); resolve(); }
    };
    rafId = requestAnimationFrame(frame);
  }

  function animateMove(from, to, type) {
    return new Promise((resolve) => {
      if (type === 'swing') animateSwing(from, to, resolve);
      else animateCrawl(from, to, resolve);
    });
  }

  async function onPerchTap(p) {
    if (!started || moving || p.id === current) return;
    if (!p.reachable) { bump(p.el); return; }
    if (p.isTarget) {
      moving = true;
      const letter = word[progress];
      await animateMove(perchPx(curPerch()), perchPx(p), p.type);
      if (!alive) return;
      current = p.id;
      play('point');
      if (!isMuted()) speak(letter);
      fillWord(progress, letter);
      progress += 1;
      moving = false;
      if (progress >= word.length) win();
      else step();
    } else {
      play('oops');
      bump(p.el);
      announce(); // gently repeat what we need
    }
  }

  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  // --- word bar ---
  function renderWordBar() {
    wordBar.innerHTML = '';
    for (let i = 0; i < word.length; i++) {
      const slot = document.createElement('span');
      slot.className = 'cs-slot';
      slot.dataset.i = i;
      slot.textContent = i < progress ? word[i] : '';
      wordBar.appendChild(slot);
    }
  }
  function fillWord(i, letter) {
    const slot = wordBar.querySelector(`.cs-slot[data-i="${i}"]`);
    if (slot) { slot.textContent = letter; slot.classList.add('filled'); }
  }

  // --- celebration + next word ---
  function win() {
    heroEl.classList.add('is-cheering');
    cheerEl.textContent = `You spelled ${word}! 🎉`;
    cheerEl.classList.add('show');
    confetti(30);
    addScore(10);
    play('point');
    if (!isMuted()) later(() => speak(`${word}! Great job!`), 200);
    later(() => {
      heroEl.classList.remove('is-cheering');
      cheerEl.classList.remove('show');
      newWord();
    }, 2400);
  }

  const CONFETTI_COLORS = ['#ff6b9d', '#ffd166', '#2ec4b6', '#5ec8ff', '#bdb2ff', '#ff8c42'];
  function confetti(n) {
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'cs-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      fxLayer.appendChild(c);
      later(() => c.remove(), 2400);
    }
  }

  function newWord() {
    word = pickWord(prevWord);
    prevWord = word;
    progress = 0;
    layout();
    renderWordBar();
    step();
  }

  // --- score + web-up-able baddies ---
  function addScore(n) { score += n; scoreN.textContent = score; }

  function scheduleEnemy() {
    if (!alive) return;
    const delay = reduceMotion ? 10000 : (7000 + Math.random() * 7000);
    later(() => { spawnEnemy(); scheduleEnemy(); }, delay);
  }

  function spawnEnemy() {
    if (!started || activeEnemy) return;
    const def = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    const el = document.createElement('button');
    el.className = 'cs-enemy';
    el.dataset.eid = def.id;
    el.setAttribute('aria-label', 'Web up the ' + def.name);
    el.style.left = (14 + Math.random() * 72) + '%';
    el.style.top = (22 + Math.random() * 52) + '%';
    el.innerHTML = `<span class="cs-enemy-art">${def.svg}</span><span class="cs-enemy-web"></span>`;
    el.addEventListener('click', () => webUp(el));
    enemyLayer.appendChild(el);
    activeEnemy = el;
    // scuttle off if it isn't webbed in time (no penalty)
    later(() => {
      if (activeEnemy === el) {
        el.classList.add('flee');
        later(() => { el.remove(); if (activeEnemy === el) activeEnemy = null; }, 400);
      }
    }, 5200);
  }

  function webUp(el) {
    if (el.classList.contains('webbed')) return;
    el.classList.add('webbed');
    addScore(ENEMY_BONUS);
    play('thwip');
    floatText(el.style.left, el.style.top, '+' + ENEMY_BONUS);
    later(() => { el.remove(); if (activeEnemy === el) activeEnemy = null; }, 700);
  }

  function floatText(left, top, text) {
    const s = document.createElement('span');
    s.className = 'cs-float';
    s.textContent = text;
    s.style.left = left; s.style.top = top;
    wall.appendChild(s);
    later(() => s.remove(), 1000);
  }

  // --- start / listeners ---
  function start() {
    if (started) return;
    unlock();
    startOverlay.classList.add('hidden');
    started = true;
    newWord();
    scheduleEnemy();
  }

  startBtn.addEventListener('click', start);
  sayBtn.addEventListener('click', () => { if (started && !moving) announce(); });
  window.addEventListener('resize', fit);

  fit();

  // --- cleanup ---
  return function unmount() {
    alive = false;
    started = false;
    cancelAnimationFrame(rafId);
    cancelSpeech();
    timers.forEach(clearTimeout);
    timers.clear();
    window.removeEventListener('resize', fit);
    game.remove();
  };
}
