// Animal Care controller. A small router across three views:
//   room   — the three pets; tap one to zoom in
//   detail — one pet, its needs meters, and the six task buttons
//   mini   — a task's mini-game (from ./minigames), which fills a goal meter
//            and, on win, tops up that need and returns to the pet
// Stats + gentle real-time decay persist to localStorage (as before).

import { ANIMALS } from './animals.js';
import { ACTIONS } from './actions.js';
import { freshStats, applyDecay, moodFor, lowestNeed, NEEDS, STAT_KEYS } from './stats.js';
import { load, save } from '../../storage.js';
import { play } from '../../audio.js';
import { MINIGAMES } from './minigames/index.js';

const SAVE_KEY = 'animal-care';
const TICK_MS = 15000;
const clamp = (n) => Math.max(0, Math.min(100, n));

export function mountAnimalCare(root) {
  // --- load + decay-on-return ---
  const saved = load(SAVE_KEY, null);
  const now = Date.now();
  const state = { animals: {} };
  ANIMALS.forEach((a) => {
    const prev = saved?.animals?.[a.id]?.stats;
    state.animals[a.id] = { stats: prev ? { ...freshStats(), ...prev } : freshStats() };
  });
  if (saved?.lastSaved) {
    const elapsed = now - saved.lastSaved;
    ANIMALS.forEach((a) => { state.animals[a.id].stats = applyDecay(state.animals[a.id].stats, elapsed); });
  }
  let lastTick = now;
  let alive = true;

  const wrap = document.createElement('div');
  wrap.className = 'ac-game';
  root.appendChild(wrap);

  let view = 'room';
  let currentPet = ANIMALS[0].id;
  let mgCleanup = null;
  let roomEls = null;

  function persist() { save(SAVE_KEY, { animals: state.animals, lastSaved: Date.now() }); }
  const petDef = (id) => ANIMALS.find((a) => a.id === id);

  // test hook
  wrap.__ac = {
    get view() { return view; },
    get pet() { return currentPet; },
    stats: (id) => ({ ...state.animals[id].stats }),
    openDetail: (id) => showDetail(id),
    openMini: (actionId) => openMini(actionId),
    goRoom: () => showRoom(),
  };

  function clearView() {
    if (mgCleanup) { mgCleanup(); mgCleanup = null; }
    wrap.innerHTML = '';
    roomEls = null;
  }

  // ---------------- ROOM ----------------
  function showRoom() {
    view = 'room';
    clearView();
    wrap.innerHTML = `
      <div class="ac-room">
        <div class="ac-wall"><div class="ac-window"><span class="ac-cloud"></span><span class="ac-cloud ac-cloud2"></span></div><div class="ac-frame">🌈</div></div>
        <div class="ac-floor"><div class="ac-rug"></div></div>
        <div class="ac-stage" role="group" aria-label="Your pets"></div>
      </div>
      <p class="ac-hint">Tap a pet to take care of it!</p>
    `;
    const stage = wrap.querySelector('.ac-stage');
    roomEls = {};
    ANIMALS.forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'ac-animal';
      btn.dataset.id = a.id;
      btn.setAttribute('aria-label', a.name + ' the ' + a.id);
      btn.innerHTML = `<span class="ac-thought" aria-hidden="true"></span><span class="ac-mood" aria-hidden="true"></span><span class="ac-name">${a.name}</span><span class="ac-art">${a.svg}</span>`;
      btn.addEventListener('click', () => { play('select'); showDetail(a.id); });
      stage.appendChild(btn);
      roomEls[a.id] = { faceEl: btn.querySelector('.ac-mood'), thoughtEl: btn.querySelector('.ac-thought'), artEl: btn.querySelector('.ac-art') };
    });
    ANIMALS.forEach((a) => refreshRoomPet(a.id));
  }

  function refreshRoomPet(id) {
    if (!roomEls || !roomEls[id]) return;
    const stats = state.animals[id].stats;
    const mood = moodFor(stats);
    roomEls[id].faceEl.textContent = mood.face;
    roomEls[id].artEl.classList.toggle('is-droopy', mood.key === 'sad');
    const need = lowestNeed(stats);
    const th = roomEls[id].thoughtEl;
    if (need) { th.textContent = need.icon; th.classList.add('show'); } else { th.classList.remove('show'); }
  }

  // ---------------- DETAIL (zoom) ----------------
  function showDetail(id) {
    view = 'detail';
    currentPet = id;
    clearView();
    const a = petDef(id);
    wrap.innerHTML = `
      <div class="ac-detail">
        <div class="ac-detail-top">
          <button class="ac-back" aria-label="Back to room">← Room</button>
          <span class="ac-detail-name">${a.name}</span>
        </div>
        <div class="ac-detail-stage"><span class="ac-detail-pet">${a.svg}</span></div>
        <div class="ac-meters"></div>
        <div class="ac-actionbar" role="toolbar" aria-label="Care tasks"></div>
      </div>
    `;
    wrap.querySelector('.ac-back').addEventListener('click', () => { play('select'); showRoom(); });

    const meters = wrap.querySelector('.ac-meters');
    NEEDS.forEach((need) => {
      const m = document.createElement('div');
      m.className = 'ac-meter';
      m.dataset.key = need.key;
      m.innerHTML = `<span class="ac-meter-icon" aria-hidden="true">${need.icon}</span><span class="ac-meter-track"><span class="ac-meter-fill"></span></span>`;
      const fill = m.querySelector('.ac-meter-fill');
      fill.style.background = need.color;
      meters.appendChild(m);
    });

    const bar = wrap.querySelector('.ac-actionbar');
    ACTIONS.forEach((act) => {
      const btn = document.createElement('button');
      btn.className = 'ac-action';
      btn.style.setProperty('--accent', act.accent);
      btn.dataset.id = act.id;
      btn.setAttribute('aria-label', act.label);
      btn.innerHTML = `<span class="ac-action-emoji" aria-hidden="true">${act.emoji}</span><span class="ac-action-label">${act.label}</span>`;
      btn.addEventListener('click', () => { play('select'); openMini(act.id); });
      bar.appendChild(btn);
    });

    refreshMeters();
  }

  function refreshMeters() {
    if (view !== 'detail') return;
    const stats = state.animals[currentPet].stats;
    wrap.querySelectorAll('.ac-meter').forEach((m) => {
      const key = m.dataset.key;
      m.querySelector('.ac-meter-fill').style.width = clamp(stats[key] ?? 0) + '%';
    });
  }

  // ---------------- MINI-GAME ----------------
  function openMini(actionId) {
    const act = ACTIONS.find((x) => x.id === actionId);
    const mg = MINIGAMES[actionId];
    if (!act || !mg) return;
    view = 'mini';
    clearView();
    mgCleanup = mg(wrap, {
      pet: petDef(currentPet),
      onWin: () => {
        const s = state.animals[currentPet].stats;
        s[act.primary] = 100;
        for (const k of STAT_KEYS) { if (act.restore?.[k] > 0) s[k] = clamp(s[k] + act.restore[k]); }
        persist();
        showDetail(currentPet);
      },
      onBack: () => showDetail(currentPet),
    });
  }

  // ---------------- decay ticker ----------------
  const ticker = setInterval(() => {
    if (!alive) return;
    const t = Date.now();
    const elapsed = t - lastTick;
    lastTick = t;
    ANIMALS.forEach((a) => { state.animals[a.id].stats = applyDecay(state.animals[a.id].stats, elapsed); });
    if (view === 'room') ANIMALS.forEach((a) => refreshRoomPet(a.id));
    else if (view === 'detail') refreshMeters();
    persist();
  }, TICK_MS);

  showRoom();

  return function unmount() {
    alive = false;
    clearInterval(ticker);
    if (mgCleanup) mgCleanup();
    persist();
    wrap.remove();
  };
}
