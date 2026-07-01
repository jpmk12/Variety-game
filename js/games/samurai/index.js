// Samurai — a kid-friendly "Fruit Ninja" with a learning twist. The game says a
// target letter out loud, tosses a wave of letters up like fruit, and the child
// swipes to slash the called one. Correct slashes score; wrong ones just puff
// away (no penalty). Rendered on a <canvas>; the HUD is DOM overlaid on top.

import { play, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from './speech.js';
import { pickTarget, buildWave, colorFor } from './content.js';

const GRAV = 1500;      // letter gravity (px/s^2)
const JUICE_GRAV = 900; // particle gravity
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountSamurai(root) {
  // --- DOM ---
  const game = document.createElement('div');
  game.className = 'sam-game';
  game.innerHTML = `
    <canvas class="sam-canvas"></canvas>
    <div class="sam-hud">
      <button class="sam-target" aria-label="Say the letter again">
        <span class="sam-target-label">Slash</span>
        <span class="sam-target-letter">?</span>
        <span class="sam-target-say" aria-hidden="true">🔊</span>
      </button>
      <div class="sam-scores">
        <span class="sam-score">0</span>
        <span class="sam-streak"></span>
      </div>
    </div>
    <div class="sam-start">
      <div class="sam-start-card">
        <div class="sam-start-emoji" aria-hidden="true">⚔️</div>
        <h2>Letter Samurai</h2>
        <p>Listen for the letter, then slash it!</p>
        <button class="sam-start-btn">Tap to Start</button>
      </div>
    </div>
  `;
  root.appendChild(game);

  const canvas = game.querySelector('.sam-canvas');
  const ctx = canvas.getContext('2d');
  const targetBtn = game.querySelector('.sam-target');
  const targetLetterEl = game.querySelector('.sam-target-letter');
  const scoreEl = game.querySelector('.sam-score');
  const streakEl = game.querySelector('.sam-streak');
  const startOverlay = game.querySelector('.sam-start');
  const startBtn = game.querySelector('.sam-start-btn');

  // --- state ---
  let W = 0, H = 0, dpr = 1;
  const objects = [];    // flying letters
  const particles = [];  // juice / sparks / text pops / score floats
  const blade = [];      // recent pointer points for the slash trail
  let score = 0;
  let streak = 0;
  let target = null;
  let prevTarget = null;
  let running = false;   // true once started, false before start / after unmount
  let raf = 0;
  let lastT = 0;

  // round scheduling (all times in seconds, off a running clock)
  let clock = 0;
  let mode = 'idle';     // 'announce' | 'spawning' | 'between'
  let spawnQueue = [];   // { item, at, startX }
  let waveClock = 0;
  let betweenUntil = 0;

  // Expose a tiny hook for automated tests.
  canvas.__game = { objects, getScore: () => score, getStreak: () => streak, getTarget: () => target };

  // --- sizing ---
  function fit() {
    const rect = game.getBoundingClientRect();
    W = rect.width; H = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // --- rounds ---
  function announceTarget() {
    if (!isMuted()) speak(`Slash the letter ${target}`);
  }

  function startRound() {
    target = pickTarget(prevTarget);
    prevTarget = target;
    targetLetterEl.textContent = target;
    targetLetterEl.style.color = colorFor(target);
    targetBtn.classList.remove('pulse');
    void targetBtn.offsetWidth;
    targetBtn.classList.add('pulse');
    announceTarget();

    // Build a wave: 1 target (sometimes 2) + a few distractors, staggered.
    const targetCount = Math.random() < 0.35 ? 2 : 1;
    const distractors = 3 + Math.floor(Math.random() * 2);
    const items = buildWave(target, { targetCount, distractors });
    spawnQueue = items.map((item, i) => ({
      item,
      at: 0.8 + i * 0.34,               // first toss after a short "announce" beat
      startX: 0.15 * W + Math.random() * 0.7 * W,
    }));
    waveClock = 0;
    mode = 'spawning';
  }

  function spawnLetter({ item, startX }) {
    const r = Math.max(34, Math.min(60, H * 0.075));
    // launch so the apex lands in the upper part of the screen
    const apexY = H * (0.12 + Math.random() * 0.22);
    const v = Math.sqrt(2 * GRAV * Math.max(60, H - apexY));
    objects.push({
      char: item.char,
      isTarget: item.isTarget,
      color: colorFor(item.char),
      x: startX,
      y: H + r,
      vx: (Math.random() * 2 - 1) * 150,
      vy: -v,
      r,
      angle: 0,
      spin: (Math.random() * 2 - 1) * 2,
    });
  }

  // --- input / slicing ---
  function localPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  let slicing = false;
  let last = null;

  function onDown(e) {
    if (!running) return;
    slicing = true;
    last = localPoint(e);
    blade.length = 0;
    blade.push({ ...last, t: clock });
  }

  function onMove(e) {
    if (!running || !slicing) return;
    const p = localPoint(e);
    blade.push({ ...p, t: clock });
    if (blade.length > 24) blade.shift();
    if (last) sliceSegment(last.x, last.y, p.x, p.y);
    last = p;
  }

  function onUp() { slicing = false; last = null; }

  // distance from point C to segment AB
  function segDist(ax, ay, bx, by, cx, cy) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((cx - ax) * dx + (cy - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = ax + t * dx, py = ay + t * dy;
    return Math.hypot(cx - px, cy - py);
  }

  function sliceSegment(ax, ay, bx, by) {
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      if (segDist(ax, ay, bx, by, o.x, o.y) < o.r) {
        objects.splice(i, 1);
        sliceLetter(o);
      }
    }
  }

  function sliceLetter(o) {
    // the letter itself pops and splits
    spawnPop(o);
    const n = reduceMotion ? 4 : 12;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 260;
      particles.push({
        kind: 'juice', x: o.x, y: o.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80,
        life: 0.6, maxLife: 0.6, size: 4 + Math.random() * 6, color: o.color,
      });
    }
    if (o.isTarget) {
      score += 1;
      streak += 1;
      scoreEl.textContent = score;
      updateStreak();
      play('point');
      floatText(o.x, o.y, '+1', '#ffd23f');
      sparkle(o.x, o.y);
      // occasional spoken reinforcement
      if (!isMuted() && (streak % 5 === 0)) speak(`${o.char}! Great!`);
    } else {
      streak = 0;
      updateStreak();
      play('oops');
      floatText(o.x, o.y, 'oops', '#9aa0b5');
    }
  }

  function spawnPop(o) {
    particles.push({
      kind: 'pop', x: o.x, y: o.y, vx: o.vx * 0.3, vy: -60,
      life: 0.45, maxLife: 0.45, size: o.r, color: o.color, char: o.char,
      angle: o.angle,
    });
  }

  function sparkle(x, y) {
    const n = reduceMotion ? 3 : 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 160;
      particles.push({
        kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.5, maxLife: 0.5, size: 3 + Math.random() * 3, color: '#ffd23f',
      });
    }
  }

  function floatText(x, y, text, color) {
    particles.push({ kind: 'float', x, y, vx: 0, vy: -70, life: 0.9, maxLife: 0.9, text, color, size: 30 });
  }

  function updateStreak() {
    streakEl.textContent = streak >= 2 ? `🔥 ${streak}` : '';
  }

  // --- update ---
  function update(dt) {
    clock += dt;

    if (mode === 'spawning') {
      waveClock += dt;
      while (spawnQueue.length && spawnQueue[0].at <= waveClock) {
        spawnLetter(spawnQueue.shift());
      }
      if (!spawnQueue.length && objects.length === 0) {
        mode = 'between';
        betweenUntil = clock + 0.7;
      }
    } else if (mode === 'between' && clock >= betweenUntil) {
      startRound();
    }

    // letters
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      o.vy += GRAV * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.angle += o.spin * dt;
      if (o.y > H + o.r * 2) objects.splice(i, 1); // fell away (a miss, no penalty)
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      if (p.kind === 'juice') p.vy += JUICE_GRAV * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // blade trail fades by age
    while (blade.length && clock - blade[0].t > 0.14) blade.shift();
  }

  // --- render ---
  function render() {
    ctx.clearRect(0, 0, W, H);

    // soft dojo backdrop
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#eaf6ff');
    g.addColorStop(1, '#cfe9ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(W * 0.78, H * 0.24, Math.min(W, H) * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // letters
    for (const o of objects) drawLetter(o.x, o.y, o.r, o.char, o.color, o.angle, 1);

    // particles
    for (const p of particles) {
      const a = Math.max(0, p.life / p.maxLife);
      if (p.kind === 'juice') {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'spark') {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        star(p.x, p.y, p.size * (0.6 + a));
      } else if (p.kind === 'pop') {
        drawLetter(p.x, p.y, p.size * (1 + (1 - a) * 0.6), p.char, p.color, p.angle, a);
      } else if (p.kind === 'float') {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.font = `900 ${p.size}px 'Baloo 2', system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;
    }

    // blade trail
    if (blade.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < blade.length; i++) {
        const t = i / blade.length;
        ctx.strokeStyle = `rgba(255,255,255,${0.15 + t * 0.7})`;
        ctx.lineWidth = 2 + t * 12;
        ctx.beginPath();
        ctx.moveTo(blade[i - 1].x, blade[i - 1].y);
        ctx.lineTo(blade[i].x, blade[i].y);
        ctx.stroke();
      }
    }
  }

  function drawLetter(x, y, r, char, color, angle, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    // fruity body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.35, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // glyph
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${r * 1.15}px 'Baloo 2', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 0, r * 0.06);
    ctx.restore();
  }

  function star(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a2) * s * 0.45, Math.sin(a2) * s * 0.45);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- loop ---
  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    update(dt);
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    unlock();
    startOverlay.classList.add('hidden');
    running = true;
    lastT = performance.now();
    startRound();
    raf = requestAnimationFrame(frame);
  }

  // --- listeners ---
  startBtn.addEventListener('click', start);
  targetBtn.addEventListener('click', () => { if (running) announceTarget(); });
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('resize', fit);

  fit();

  // --- cleanup ---
  return function unmount() {
    running = false;
    cancelAnimationFrame(raf);
    cancelSpeech();
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('resize', fit);
    game.remove();
  };
}
