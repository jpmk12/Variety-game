// Metal Makers — a build-it welding workshop. Each level makes one metal
// creation through a pipeline: CUT every piece out of a sheet with the torch,
// WELD the seams that join them, RIVET the fastening holes, then reveal the
// finished creation and add it to your shelf. Drag anywhere to cut/weld; tap the
// holes to rivet. No timer, no losing — everything only moves forward.

import { play, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from '../samurai/speech.js';
import { load, save } from '../../storage.js';
import { award, unlockSticker } from '../../progress.js';
import { buildFor, MAX_LEVEL } from './builds.js';

const SAVE_KEY = 'metal-makers';
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountMetalMakers(root) {
  const game = document.createElement('div');
  game.className = 'met-game';
  game.innerHTML = `
    <div class="met-workshop">
      <div class="met-top">
        <span class="met-level"></span>
        <span class="met-shelf" aria-label="Creations built"></span>
      </div>
      <p class="met-step" role="status"></p>
      <div class="met-stagewrap"></div>
      <div class="met-banner" role="status"></div>
    </div>
    <div class="met-start">
      <div class="met-start-card">
        <div class="met-start-emoji" aria-hidden="true">🔧</div>
        <h2>Metal Makers</h2>
        <p>Cut, weld and rivet cool metal creations!</p>
        <button class="met-start-btn">Open the Workshop!</button>
      </div>
    </div>
  `;
  root.appendChild(game);

  const levelEl = game.querySelector('.met-level');
  const shelfEl = game.querySelector('.met-shelf');
  const stepEl = game.querySelector('.met-step');
  const stage = game.querySelector('.met-stagewrap');
  const banner = game.querySelector('.met-banner');
  const startOverlay = game.querySelector('.met-start');
  const startBtn = game.querySelector('.met-start-btn');

  // --- state ---
  const saved = load(SAVE_KEY, {}) || {};
  let level = Math.min(MAX_LEVEL, Math.max(1, saved.level | 0 || 1));
  let shelf = Array.isArray(saved.shelf) ? saved.shelf.slice() : [];
  let build = null;
  let phase = 'cut';         // cut → weld → rivet → reveal
  let pieceIdx = 0;
  let piecesCut = 0;
  let seamIdx = 0;
  let seamsWelded = 0;
  const rivetsPlaced = new Set();
  let busy = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const persist = () => save(SAVE_KEY, { level, shelf });
  const EMOJI = { star: '⭐', rocket: '🚀', robot: '🤖', trophy: '🏆' };

  renderShelf();

  // test hook — drives the pipeline without simulating real pointer drags
  game.__met = {
    get level() { return level; },
    get phase() { return phase; },
    get build() { return build && build.id; },
    get piecesCut() { return piecesCut; },
    get totalPieces() { return build ? build.pieces.length : 0; },
    get seamsWelded() { return seamsWelded; },
    get totalSeams() { return build ? build.seams.length : 0; },
    get rivetsPlaced() { return rivetsPlaced.size; },
    get totalRivets() { return build ? build.rivets.length : 0; },
    get shelf() { return shelf.slice(); },
    get done() { return phase === 'reveal'; },
    get busy() { return busy; },
    start: () => start(),
    cut: () => completeCut(),
    weld: () => completeSeam(),
    rivet: (i) => placeRivet(i),
    setLevel: (n) => { level = Math.min(MAX_LEVEL, Math.max(1, n)); persist(); startBuild(); },
  };

  function start() { unlock(); startOverlay.classList.add('hidden'); startBuild(); }

  function startBuild() {
    build = buildFor(level);
    phase = 'cut'; pieceIdx = 0; piecesCut = 0; seamIdx = 0; seamsWelded = 0;
    rivetsPlaced.clear(); busy = false;
    renderLevel();
    renderCut();
  }

  function renderLevel() { levelEl.textContent = level > 1 ? `Level ${level}` : ''; }
  function renderShelf() { shelfEl.textContent = shelf.map((id) => EMOJI[id] || '🔩').join(' '); }

  // ---- CUT ----
  function renderCut() {
    const piece = build.pieces[pieceIdx];
    stepEl.textContent = `Cut out the ${piece.name}! 🔥`;
    if (!isMuted()) later(() => speak('Cut the ' + piece.name), 250);
    stage.innerHTML = `
      <div class="met-svgwrap met-cutwrap">
        <svg viewBox="0 0 200 200" class="met-svg" aria-label="Metal sheet">
          <rect x="8" y="8" width="184" height="184" rx="12" class="met-sheet"/>
          <path d="${piece.path}" class="met-cutguide"/>
          <path d="${piece.path}" class="met-cutline" pathLength="1"/>
          <path d="${piece.path}" class="met-cutpiece" fill="${piece.fill}" style="opacity:0"/>
        </svg>
        <div class="met-torch" aria-hidden="true">🔥</div>
      </div>`;
    const wrap = stage.querySelector('.met-svgwrap');
    const pathEl = stage.querySelector('.met-cutline');
    const torch = stage.querySelector('.met-torch');
    let pathLen = 100;
    try { pathLen = pathEl.getTotalLength(); } catch (e) { /* jsdom */ }
    let cutLen = 0;
    positionTorch(0);

    function positionTorch(len) {
      let pt = { x: 100, y: 40 };
      try { pt = pathEl.getPointAtLength(len); } catch (e) { /* ignore */ }
      torch.style.left = (pt.x / 200 * 100) + '%';
      torch.style.top = (pt.y / 200 * 100) + '%';
      return pt;
    }
    // reveal the cut outline progressively via stroke-dashoffset
    function paint() { pathEl.style.strokeDashoffset = String(1 - cutLen / pathLen); }
    paint();

    let tracing = false, last = null, sparkAt = 0;
    const down = (e) => { if (busy) return; tracing = true; last = { x: e.clientX, y: e.clientY }; e.preventDefault(); };
    const move = (e) => {
      if (!tracing || busy) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      cutLen = Math.min(pathLen, cutLen + Math.hypot(dx, dy) * 1.4);
      const pt = positionTorch(cutLen);
      paint();
      const now = e.timeStamp || 0;
      if (now - sparkAt > 60) { sparkAt = now; spark(wrap, pt); if (Math.random() < 0.5) play('torch'); }
      if (cutLen >= pathLen) { tracing = false; completeCut(); }
    };
    const up = () => { tracing = false; };
    wrap.addEventListener('pointerdown', down);
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerup', up);
    wrap.addEventListener('pointerleave', up);
    // let the hook finish instantly by filling the outline first
    wrap._finish = () => { cutLen = pathLen; paint(); };
  }

  function spark(wrap, pt) {
    if (reduceMotion) return;
    const s = document.createElement('span');
    s.className = 'met-spark';
    s.style.left = (pt.x / 200 * 100) + '%';
    s.style.top = (pt.y / 200 * 100) + '%';
    s.style.setProperty('--sx', (Math.random() * 30 - 15) + 'px');
    s.style.setProperty('--sy', (Math.random() * 24 + 6) + 'px');
    wrap.appendChild(s);
    later(() => s.remove(), 420);
  }

  function completeCut() {
    if (busy) return;
    busy = true;
    const wrap = stage.querySelector('.met-svgwrap');
    if (wrap && wrap._finish) wrap._finish();
    const cutPiece = stage.querySelector('.met-cutpiece');
    if (cutPiece) { cutPiece.style.opacity = '1'; cutPiece.classList.add('met-pop'); }
    play('clink');
    piecesCut += 1;
    later(() => {
      busy = false;
      if (pieceIdx < build.pieces.length - 1) { pieceIdx += 1; renderCut(); }
      else advanceFromCut();
    }, 620);
  }

  function advanceFromCut() {
    if (build.seams.length) { phase = 'weld'; seamIdx = 0; renderWeld(); }
    else if (build.rivets.length) { phase = 'rivet'; renderRivet(); }
    else reveal();
  }

  // ---- assembled-pieces SVG shared by weld / rivet / reveal ----
  function piecesSVG(extra) {
    const parts = build.pieces.map((p) => `<path d="${p.path}" transform="${p.asm}" fill="${p.fill}" class="met-asm"/>`).join('');
    return `<svg viewBox="0 0 200 200" class="met-svg" aria-label="Assembly">${parts}${extra || ''}</svg>`;
  }

  // ---- WELD ----
  function renderWeld() {
    stepEl.textContent = 'Weld the seam! ⚡';
    if (!isMuted()) later(() => speak('Weld it'), 250);
    const seams = build.seams.map((s, i) => {
      const cls = i < seamsWelded ? 'met-seam is-welded' : (i === seamIdx ? 'met-seam is-active' : 'met-seam');
      return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" class="${cls}" data-seam="${i}"/>`;
    }).join('');
    stage.innerHTML = `
      <div class="met-svgwrap met-weldwrap">
        ${piecesSVG(seams)}
        <div class="met-welder" aria-hidden="true">⚡</div>
      </div>`;
    const wrap = stage.querySelector('.met-svgwrap');
    const seam = build.seams[seamIdx];
    const seamEl = stage.querySelector(`.met-seam[data-seam="${seamIdx}"]`);
    const welder = stage.querySelector('.met-welder');
    const segLen = Math.hypot(seam.x2 - seam.x1, seam.y2 - seam.y1);
    let fill = 0;
    positionWelder(0);
    function positionWelder(f) {
      const x = seam.x1 + (seam.x2 - seam.x1) * f;
      const y = seam.y1 + (seam.y2 - seam.y1) * f;
      welder.style.left = (x / 200 * 100) + '%';
      welder.style.top = (y / 200 * 100) + '%';
    }
    function paint() { if (seamEl) { seamEl.style.strokeDasharray = String(segLen); seamEl.style.strokeDashoffset = String(segLen * (1 - fill)); } }
    paint();
    let welding = false, last = null;
    const down = (e) => { if (busy) return; welding = true; last = { x: e.clientX, y: e.clientY }; e.preventDefault(); };
    const move = (e) => {
      if (!welding || busy) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      fill = Math.min(1, fill + Math.hypot(dx, dy) / 140);
      positionWelder(fill); paint();
      if (Math.random() < 0.3) play('weld');
      if (fill >= 1) { welding = false; completeSeam(); }
    };
    const up = () => { welding = false; };
    wrap.addEventListener('pointerdown', down);
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerup', up);
    wrap.addEventListener('pointerleave', up);
  }

  function completeSeam() {
    if (busy) return;
    busy = true;
    play('weld');
    const seamEl = stage.querySelector(`.met-seam[data-seam="${seamIdx}"]`);
    if (seamEl) { seamEl.style.strokeDashoffset = '0'; seamEl.classList.add('is-welded'); }
    seamsWelded += 1;
    unlockSticker('met-weld');
    later(() => {
      busy = false;
      if (seamIdx < build.seams.length - 1) { seamIdx += 1; renderWeld(); }
      else if (build.rivets.length) { phase = 'rivet'; renderRivet(); }
      else reveal();
    }, 520);
  }

  // ---- RIVET ----
  function renderRivet() {
    stepEl.textContent = 'Rivet it on! 🔩';
    if (!isMuted()) later(() => speak('Rivet it'), 250);
    const holes = build.rivets.map((h, i) => {
      const placed = rivetsPlaced.has(i);
      return `<g class="met-hole${placed ? ' is-placed' : ''}" data-hole="${i}">
        <circle cx="${h.cx}" cy="${h.cy}" r="10" class="met-hole-ring"/>
        ${placed ? `<circle cx="${h.cx}" cy="${h.cy}" r="7" class="met-rivet-head"/>` : ''}
      </g>`;
    }).join('');
    stage.innerHTML = `<div class="met-svgwrap met-rivetwrap">${piecesSVG(holes)}</div>`;
    stage.querySelectorAll('.met-hole').forEach((g) => {
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); placeRivet(Number(g.dataset.hole)); });
    });
  }

  function placeRivet(i) {
    if (busy || phase !== 'rivet') return;
    if (i == null || i < 0 || i >= build.rivets.length || rivetsPlaced.has(i)) return;
    rivetsPlaced.add(i);
    play('rivet');
    unlockSticker('met-rivet');
    renderRivet();
    if (rivetsPlaced.size >= build.rivets.length) later(reveal, 400);
  }

  // ---- REVEAL ----
  function reveal() {
    phase = 'reveal';
    busy = true;
    stepEl.textContent = `You made a ${build.name}! ${build.emoji}`;
    stage.innerHTML = `<div class="met-svgwrap met-revealwrap">
      ${piecesSVG('')}
      <div class="met-shine" aria-hidden="true"></div>
      <div class="met-reveal-badge" aria-hidden="true">${build.emoji}</div>
    </div>`;
    confetti();
    play('happy');
    if (!isMuted()) speak('You made a ' + build.name + '!');
    if (!shelf.includes(build.id)) shelf.push(build.id);
    renderShelf();
    const leveled = level < MAX_LEVEL;
    if (leveled) level += 1;
    persist();
    renderLevel();
    award({ stars: 3, counter: 'metBuilds', stickers: ['met-first'] });
    if (build.id === 'trophy') unlockSticker('met-master');
    showBanner(leveled ? `${build.emoji} Nice work! Next build 🎉` : `${build.emoji} Master Smith! 🎉`, true);
    later(startBuild, 2800);
  }

  function showBanner(msg, good) {
    banner.textContent = msg;
    banner.classList.toggle('is-good', !!good);
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    later(() => banner.classList.remove('show'), 2000);
  }

  const CONFETTI = ['#ffd166', '#ff8c42', '#8ecae6', '#bdb2ff', '#90be6d', '#5ec8ff'];
  function confetti() {
    const n = reduceMotion ? 10 : 26;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'met-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = CONFETTI[i % CONFETTI.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      game.querySelector('.met-workshop').appendChild(c);
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
