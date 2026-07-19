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

// A little goggled construction worker who watches you work in the corner —
// bobs while idle, nods on each step, and throws their arms up on a finish.
const WORKER_SVG = `<div class="met-worker" aria-hidden="true"><svg viewBox="0 0 100 132">
  <ellipse cx="50" cy="127" rx="28" ry="5" fill="rgba(0,0,0,0.12)"/>
  <rect x="40" y="104" width="9" height="20" rx="4" fill="#4a5560"/>
  <rect x="51" y="104" width="9" height="20" rx="4" fill="#4a5560"/>
  <g class="met-arm l"><rect x="21" y="74" width="10" height="27" rx="5" fill="#ffb765"/></g>
  <g class="met-arm r"><rect x="69" y="74" width="10" height="27" rx="5" fill="#ffb765"/></g>
  <rect x="28" y="70" width="44" height="42" rx="14" fill="#ff9f43"/>
  <rect x="46" y="72" width="8" height="38" fill="#ffe08a"/>
  <rect x="30" y="84" width="40" height="5" fill="#ffe08a"/>
  <circle cx="50" cy="50" r="24" fill="#ffd8a8"/>
  <rect x="30" y="44" width="40" height="14" rx="7" fill="#3f4a54"/>
  <circle cx="42" cy="51" r="6.5" fill="#8fd0ff"/><circle cx="58" cy="51" r="6.5" fill="#8fd0ff"/>
  <circle cx="40" cy="49" r="2" fill="#fff" opacity="0.85"/><circle cx="56" cy="49" r="2" fill="#fff" opacity="0.85"/>
  <path d="M44 63 q6 6 12 0" stroke="#b5764a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M26 40 a24 20 0 0 1 48 0 Z" fill="#ffd166"/>
  <rect x="34" y="25" width="32" height="8" rx="4" fill="#ffe08a"/>
  <rect x="22" y="38" width="56" height="6" rx="3" fill="#f0a53c"/>
</svg></div>`;

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
      ${WORKER_SVG}
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
  const worker = game.querySelector('.met-worker');
  const startOverlay = game.querySelector('.met-start');
  const startBtn = game.querySelector('.met-start-btn');

  // the worker reacts to what you do (nod on a step, cheer on a finish)
  function workerReact(cls, ms) {
    if (!worker || reduceMotion) return;
    worker.classList.remove(cls); void worker.offsetWidth; worker.classList.add(cls);
    later(() => worker.classList.remove(cls), ms);
  }

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
  function renderShelf() { shelfEl.innerHTML = shelf.map((id) => `<span class="met-shelf-item">${EMOJI[id] || '🔩'}</span>`).join(''); }

  // shared SVG defs: metallic gradients, bolt + rivet domes, drilled holes
  const DEFS = `<defs>
      <linearGradient id="mm-sheet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d8e0e7"/><stop offset="0.45" stop-color="#aab6c1"/>
        <stop offset="0.55" stop-color="#9dabb7"/><stop offset="1" stop-color="#c5cdd5"/>
      </linearGradient>
      <linearGradient id="mm-hi" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/>
        <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.05"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0.18"/>
      </linearGradient>
      <radialGradient id="mm-bolt" cx="0.4" cy="0.35"><stop offset="0" stop-color="#eef2f5"/><stop offset="1" stop-color="#889aa6"/></radialGradient>
      <radialGradient id="mm-rivet" cx="0.38" cy="0.32"><stop offset="0" stop-color="#f5f8fa"/><stop offset="0.55" stop-color="#cfd7de"/><stop offset="1" stop-color="#8b96a0"/></radialGradient>
      <radialGradient id="mm-hole" cx="0.42" cy="0.42"><stop offset="0" stop-color="#333c44"/><stop offset="1" stop-color="#5c6975"/></radialGradient>
    </defs>`;

  // a bolted, brushed metal sheet; `inner` draws the cut art on top
  function sheetSVG(inner) {
    const bolts = [[22, 22], [178, 22], [22, 178], [178, 178]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="url(#mm-bolt)" stroke="#788591" stroke-width="1"/><circle cx="${x - 1.6}" cy="${y - 1.6}" r="1.6" fill="#fff" opacity="0.7"/>`).join('');
    return `<svg viewBox="0 0 200 200" class="met-svg" aria-label="Metal sheet">${DEFS}
      <rect x="8" y="8" width="184" height="184" rx="16" fill="url(#mm-sheet)" stroke="#8a96a1" stroke-width="3"/>
      <g opacity="0.09" stroke="#41505c" stroke-width="1">
        <line x1="18" y1="54" x2="182" y2="54"/><line x1="18" y1="94" x2="182" y2="94"/>
        <line x1="18" y1="134" x2="182" y2="134"/><line x1="18" y1="170" x2="182" y2="170"/>
      </g>
      ${bolts}${inner}
    </svg>`;
  }

  // pointer → svg-space (0..200), wrap-percentage, and wrap-pixel helpers
  function ptXY(wrap, e) {
    const r = wrap.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * 200, y: (e.clientY - r.top) / r.height * 200,
      px: (e.clientX - r.left) / r.width * 100, py: (e.clientY - r.top) / r.height * 100,
      lx: e.clientX - r.left, ly: e.clientY - r.top,
    };
  }
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  function distSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1;
    let t = ((px - x1) * dx + (py - y1) * dy) / L; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
  }
  // Move a tool to a wrap-pixel point via a composited transform (no layout).
  function positionTool(el, xpx, ypx) { if (el) { el.style.transform = `translate(${xpx}px, ${ypx}px)`; } }
  // Convert an svg-space point (0..200) to a wrap-pixel point for the tools.
  function svgToPx(wrap, sx, sy) { const r = wrap.getBoundingClientRect(); return [sx / 200 * r.width, sy / 200 * r.height]; }

  // The tools — inline SVG so they read clearly and their tip lands on the finger.
  function torchTool() {
    return `<div class="met-tool met-torch" aria-hidden="true"><svg viewBox="0 0 64 92">
      <rect x="6" y="10" width="30" height="13" rx="6" fill="#586b30" transform="rotate(24 21 16)"/>
      <rect x="10" y="20" width="14" height="9" rx="4" fill="#455423" transform="rotate(24 17 24)"/>
      <rect x="26" y="20" width="14" height="30" rx="6" fill="#c6cfd6" transform="rotate(10 33 35)"/>
      <rect x="27" y="22" width="5" height="26" rx="2.5" fill="#eef3f6" transform="rotate(10 33 35)" opacity="0.8"/>
      <circle cx="33" cy="52" r="6.5" fill="#6b7883"/>
      <path class="met-flame o" d="M33 50 q15 9 5 26 q-2 6 -6 10 q-4 -4 -6 -10 q-10 -17 7 -26 Z" fill="#ff8c2e"/>
      <path class="met-flame i" d="M32 56 q9 6 3 17 q-1 4 -3 7 q-2 -3 -3 -7 q-6 -11 6 -17 Z" fill="#ffd24a"/>
      <ellipse class="met-flame c" cx="30.5" cy="72" rx="3" ry="7" fill="#bfe3ff"/>
    </svg></div>`;
  }
  function welderTool() {
    return `<div class="met-tool met-welder" aria-hidden="true"><svg viewBox="0 0 60 92">
      <rect x="8" y="12" width="26" height="14" rx="7" fill="#2f6690" transform="rotate(26 21 19)"/>
      <rect x="24" y="22" width="10" height="34" rx="5" fill="#c6cfd6" transform="rotate(10 29 39)"/>
      <rect x="27" y="52" width="5" height="16" rx="2.5" fill="#8a96a1" transform="rotate(10 29 60)"/>
      <circle class="met-arc" cx="30" cy="70" r="7" fill="#eaf6ff"/>
    </svg></div>`;
  }
  function gunTool() {
    return `<div class="met-tool met-rivetgun" aria-hidden="true"><svg viewBox="0 0 60 92">
      <rect x="10" y="14" width="30" height="20" rx="6" fill="#546" transform="rotate(12 25 24)" style="fill:#5b6b78"/>
      <rect x="14" y="30" width="14" height="26" rx="5" fill="#7a8791" transform="rotate(12 21 43)"/>
      <rect x="25" y="52" width="12" height="16" rx="3" fill="#c6cfd6"/>
      <rect x="28" y="66" width="6" height="10" rx="2" fill="#8a96a1"/>
    </svg></div>`;
  }

  // ---- CUT ----
  function renderCut() {
    const piece = build.pieces[pieceIdx];
    stepEl.textContent = `Cut out the ${piece.name}! 🔥`;
    if (!isMuted()) later(() => speak('Cut the ' + piece.name), 250);
    stage.innerHTML = `
      <div class="met-svgwrap met-cutwrap">
        ${sheetSVG(`
          <path d="${piece.path}" class="met-cutguide"/>
          <path d="${piece.path}" class="met-cutline" pathLength="1"/>
          <path d="${piece.path}" class="met-cutpiece" fill="${piece.fill}" style="opacity:0"/>
          <path d="${piece.path}" class="met-cutpiece-hi" fill="url(#mm-hi)" style="opacity:0"/>
        `)}
        <div class="met-ember" aria-hidden="true"></div>
        ${torchTool()}
      </div>`;
    const wrap = stage.querySelector('.met-svgwrap');
    const pathEl = stage.querySelector('.met-cutline');
    const torch = stage.querySelector('.met-torch');
    const ember = stage.querySelector('.met-ember');
    let pathLen = 100;
    try { pathLen = pathEl.getTotalLength(); } catch (e) { /* jsdom */ }
    let cutLen = 0;

    const frontier = () => { try { return pathEl.getPointAtLength(cutLen); } catch (e) { return { x: 100, y: 40 }; } };
    function paint() {
      pathEl.style.strokeDashoffset = String(1 - cutLen / pathLen);
      const f = frontier();
      ember.style.left = (f.x / 200 * 100) + '%';
      ember.style.top = (f.y / 200 * 100) + '%';
    }
    paint();
    // torch starts parked at the beginning of the cut so kids see where to start
    { const f = frontier(); positionTool(torch, ...svgToPx(wrap, f.x, f.y)); }

    let tracing = false, lastP = null, sparkAt = 0;
    const down = (e) => {
      if (busy) return;
      tracing = true; const p = ptXY(wrap, e); lastP = p;
      positionTool(torch, p.lx, p.ly); torch.classList.add('is-on');
      e.preventDefault();
    };
    const move = (e) => {
      const p = ptXY(wrap, e);
      positionTool(torch, p.lx, p.ly);   // the torch ALWAYS follows the finger
      if (!tracing || busy) { lastP = p; return; }
      const f = frontier();
      if (dist(p.x, p.y, f.x, f.y) < 44) {           // near the cut's leading edge → cut!
        const moved = lastP ? dist(p.x, p.y, lastP.x, lastP.y) : 0;
        cutLen = Math.min(pathLen, cutLen + Math.max(moved * 1.5, 0.9));
        paint();
        torch.classList.add('is-cutting');
        const now = e.timeStamp || 0;
        if (now - sparkAt > 45) { sparkAt = now; spark(wrap, p.px, p.py); if (Math.random() < 0.5) play('torch'); }
        if (cutLen >= pathLen) { tracing = false; completeCut(); }
      } else {
        torch.classList.remove('is-cutting');
      }
      lastP = p;
    };
    const up = () => { tracing = false; torch.classList.remove('is-cutting'); };
    wrap.addEventListener('pointerdown', down);
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerup', up);
    wrap.addEventListener('pointerleave', up);
    wrap._finish = () => { cutLen = pathLen; paint(); };
  }

  // a little shower of sparks flying off the tool tip
  function spark(wrap, px, py) {
    if (reduceMotion) return;
    for (let k = 0; k < 3; k++) {
      const s = document.createElement('span');
      s.className = 'met-spark';
      s.style.left = px + '%';
      s.style.top = py + '%';
      s.style.setProperty('--sx', (Math.random() * 44 - 22).toFixed(1) + 'px');
      s.style.setProperty('--sy', (16 + Math.random() * 30).toFixed(1) + 'px');
      wrap.appendChild(s);
      later(() => s.remove(), 460);
    }
  }

  function completeCut() {
    if (busy) return;
    busy = true;
    const wrap = stage.querySelector('.met-svgwrap');
    if (wrap && wrap._finish) wrap._finish();
    stage.querySelectorAll('.met-cutpiece, .met-cutpiece-hi').forEach((el) => { el.style.opacity = '1'; el.classList.add('met-pop'); });
    const emberEl = stage.querySelector('.met-ember');
    if (emberEl) emberEl.style.opacity = '0';
    play('clink');
    workerReact('nod', 500);
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
  // Each piece gets its solid colour plus a metallic light→shadow overlay.
  function piecesSVG(extra) {
    const parts = build.pieces.map((p) =>
      `<path d="${p.path}" transform="${p.asm}" fill="${p.fill}" class="met-asm"/>`
      + `<path d="${p.path}" transform="${p.asm}" fill="url(#mm-hi)" class="met-asm-hi"/>`).join('');
    return `<svg viewBox="0 0 200 200" class="met-svg" aria-label="Assembly">${DEFS}${parts}${extra || ''}</svg>`;
  }

  // ---- WELD ----
  function renderWeld() {
    stepEl.textContent = 'Weld the seam! ⚡';
    if (!isMuted()) later(() => speak('Weld it'), 250);
    // draw every seam: already-welded ones get a solid gold bead; the current
    // one gets a bead that fills as you weld along it.
    const seams = build.seams.map((s, i) => {
      const base = `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" class="met-seam${i < seamsWelded ? ' is-welded' : (i === seamIdx ? ' is-active' : '')}" data-seam="${i}"/>`;
      if (i < seamsWelded) return base + `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" class="met-bead"/>`;
      return base;
    }).join('');
    const seam = build.seams[seamIdx];
    const activeBead = `<line x1="${seam.x1}" y1="${seam.y1}" x2="${seam.x2}" y2="${seam.y2}" class="met-bead met-bead-active"/>`;
    stage.innerHTML = `
      <div class="met-svgwrap met-weldwrap">
        ${piecesSVG(seams + activeBead)}
        ${welderTool()}
      </div>`;
    const wrap = stage.querySelector('.met-svgwrap');
    const seamEl = stage.querySelector(`.met-seam[data-seam="${seamIdx}"]`);
    const bead = stage.querySelector('.met-bead-active');
    const welder = stage.querySelector('.met-welder');
    const segLen = Math.hypot(seam.x2 - seam.x1, seam.y2 - seam.y1);
    let fill = 0;
    // park the welder at the seam's start
    positionTool(welder, ...svgToPx(wrap, seam.x1, seam.y1));
    function paint() { if (bead) { bead.style.strokeDasharray = String(segLen); bead.style.strokeDashoffset = String(segLen * (1 - fill)); } }
    paint();
    let welding = false, lastP = null, sparkAt = 0;
    const down = (e) => { if (busy) return; welding = true; const p = ptXY(wrap, e); lastP = p; positionTool(welder, p.lx, p.ly); welder.classList.add('is-on'); e.preventDefault(); };
    const move = (e) => {
      const p = ptXY(wrap, e);
      positionTool(welder, p.lx, p.ly);        // the welder always follows the finger
      if (!welding || busy) { lastP = p; return; }
      if (distSeg(p.x, p.y, seam.x1, seam.y1, seam.x2, seam.y2) < 34) {   // near the seam → weld!
        const moved = lastP ? dist(p.x, p.y, lastP.x, lastP.y) : 0;
        fill = Math.min(1, fill + Math.max(moved, 0.6) / 58);
        paint(); welder.classList.add('is-arcing');
        const now = e.timeStamp || 0;
        if (now - sparkAt > 55) { sparkAt = now; spark(wrap, p.px, p.py); if (Math.random() < 0.5) play('weld'); }
        if (fill >= 1) { welding = false; completeSeam(); }
      } else { welder.classList.remove('is-arcing'); }
      lastP = p;
    };
    const up = () => { welding = false; welder.classList.remove('is-arcing'); };
    wrap.addEventListener('pointerdown', down);
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerup', up);
    wrap.addEventListener('pointerleave', up);
  }

  function completeSeam() {
    if (busy) return;
    busy = true;
    play('weld');
    const bead = stage.querySelector('.met-bead-active');
    if (bead) bead.style.strokeDashoffset = '0';
    const seamEl = stage.querySelector(`.met-seam[data-seam="${seamIdx}"]`);
    if (seamEl) seamEl.classList.add('is-welded');
    seamsWelded += 1;
    unlockSticker('met-weld');
    workerReact('nod', 500);
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
        <circle cx="${h.cx}" cy="${h.cy}" r="10" fill="url(#mm-hole)" stroke="#5b6b78" stroke-width="1.5"/>
        ${placed ? `<circle cx="${h.cx}" cy="${h.cy}" r="9.5" fill="url(#mm-rivet)" stroke="#7a8791" stroke-width="1" class="met-rivet-head"/><circle cx="${h.cx - 3}" cy="${h.cy - 3}" r="2.6" fill="#fff" opacity="0.75"/>` : ''}
      </g>`;
    }).join('');
    stage.innerHTML = `<div class="met-svgwrap met-rivetwrap">${piecesSVG(holes)}${gunTool()}</div>`;
    const wrap = stage.querySelector('.met-svgwrap');
    const gun = stage.querySelector('.met-rivetgun');
    positionTool(gun, ...svgToPx(wrap, 100, 100));   // park at centre until the finger arrives
    wrap.addEventListener('pointermove', (e) => { const p = ptXY(wrap, e); positionTool(gun, p.lx, p.ly); });
    stage.querySelectorAll('.met-hole').forEach((g) => {
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const p = ptXY(wrap, e);
        positionTool(gun, p.lx, p.ly);
        gun.classList.remove('is-firing'); void gun.offsetWidth; gun.classList.add('is-firing');
        if (!rivetsPlaced.has(Number(g.dataset.hole))) spark(wrap, p.px, p.py);
        placeRivet(Number(g.dataset.hole));
      });
    });
  }

  function placeRivet(i) {
    if (busy || phase !== 'rivet') return;
    if (i == null || i < 0 || i >= build.rivets.length || rivetsPlaced.has(i)) return;
    rivetsPlaced.add(i);
    play('rivet');
    unlockSticker('met-rivet');
    workerReact('nod', 500);
    renderRivet();
    if (rivetsPlaced.size >= build.rivets.length) later(reveal, 400);
  }

  // ---- REVEAL ----
  function reveal() {
    phase = 'reveal';
    busy = true;
    stepEl.textContent = `You made a ${build.name}! ${build.emoji}`;
    const sparkles = reduceMotion ? '' : Array.from({ length: 6 }, (_, i) =>
      `<span class="met-sparkle" style="left:${15 + Math.random() * 70}%;top:${15 + Math.random() * 60}%;animation-delay:${(i * 0.12).toFixed(2)}s">✦</span>`).join('');
    stage.innerHTML = `<div class="met-svgwrap met-revealwrap">
      ${piecesSVG(build.details || '')}
      <div class="met-shine" aria-hidden="true"></div>
      ${sparkles}
      <div class="met-reveal-badge" aria-hidden="true">${build.emoji}</div>
    </div>`;
    confetti();
    play('happy');
    workerReact('cheer', 1700);
    if (!isMuted()) speak('You made a ' + build.name + '!');
    if (!shelf.includes(build.id)) shelf.push(build.id);
    renderShelf();
    const items = shelfEl.querySelectorAll('.met-shelf-item');
    if (items.length && !reduceMotion) items[items.length - 1].classList.add('pop');
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
