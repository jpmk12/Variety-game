// Animal Care controller. A small router across three views:
//   room   — the three pets; tap one to zoom in
//   detail — one pet, its needs meters, and the six task buttons
//   mini   — a task's mini-game (from ./minigames), which fills a goal meter
//            and, on win, tops up that need and returns to the pet
// Stats + gentle real-time decay persist to localStorage (as before).

import { ANIMALS, STARTER_IDS } from './animals.js';
import { ACTIONS } from './actions.js';
import { freshStats, applyDecay, moodFor, lowestNeed, NEEDS, STAT_KEYS } from './stats.js';
import { load, save } from '../../storage.js';
import { play, playVoice } from '../../audio.js';
import { award, getBond, getStars, spendStars, unlockSticker, getCounter } from '../../progress.js';
import { MINIGAMES } from './minigames/index.js';
import { mountTricks, TRICKS } from './minigames/tricks.js';
import { ACCESSORIES, accessoryById } from './accessories.js';
import { decoratePet } from './wardrobe.js';
import { DECOR, decorById } from './decor.js';

const SAVE_KEY = 'animal-care';
const TICK_MS = 15000;
const MAX_LEVEL = 3;
const EGG_WARMTH = 6;   // taps to hatch an egg
// Pets that hatch from an egg, in order, once this many total care wins are in.
// Each egg only appears after the previous one has hatched.
const HATCH = [
  { id: 'bunny',  at: 4 },
  { id: 'dragon', at: 12 },
];
const clamp = (n) => Math.max(0, Math.min(100, n));

// Each care task grants stars + friendship XP and unlocks its activity sticker
// (plus the shared "First Friend" one). progress.js also auto-checks milestone
// stickers (bond level, star totals) after every award.
const ACTION_STICKER = {
  feed: 'ac-feed', water: 'ac-water', bath: 'ac-bath',
  brush: 'ac-brush', play: 'ac-play', nighttime: 'ac-night',
};

export function mountAnimalCare(root) {
  // --- load + decay-on-return ---
  const saved = load(SAVE_KEY, null);
  const now = Date.now();
  const state = { animals: {} };
  ANIMALS.forEach((a) => {
    const prev = saved?.animals?.[a.id]?.stats;
    state.animals[a.id] = { stats: prev ? { ...freshStats(), ...prev } : freshStats() };
  });
  // Wardrobe: which accessories are owned (bought once, shared) and which each
  // pet currently wears ({ petId: { slot: accessoryId } }).
  const wardrobe = {
    owned: { ...(saved?.wardrobe?.owned || {}) },
    equipped: { ...(saved?.wardrobe?.equipped || {}) },
  };
  ANIMALS.forEach((a) => { if (!wardrobe.equipped[a.id]) wardrobe.equipped[a.id] = {}; });
  // Tricks each pet has learned at Trick School ({ petId: ['sit','spin',…] }).
  const tricks = { ...(saved?.tricks || {}) };
  // Per-game difficulty level (1..MAX_LEVEL), shared across pets — each win in a
  // game bumps its level so the challenge grows with the child.
  const levels = { ...(saved?.levels || {}) };
  // Living world: which egg-pets have hatched (migrates the old `hatched`
  // boolean, which only ever meant the bunny).
  const hatchedIds = new Set(saved?.hatchedIds || (saved?.hatched ? ['bunny'] : []));
  // Warmth toward hatching the next egg — persisted so it isn't lost when the
  // child leaves the room mid-warming (the next egg is deterministic, so the
  // saved value always belongs to whichever egg is currently due).
  let eggWarmth = saved?.eggWarmth || 0;
  let eggPet = null; // which pet the current egg will hatch into
  // Room decorations: which are owned (bought once) and which are placed.
  const decor = {
    owned: { ...(saved?.decor?.owned || {}) },
    placed: { ...(saved?.decor?.placed || {}) },
  };
  let hourOverride = null; // test hook for the day/night cycle
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
  let eggEl = null;

  function persist() { save(SAVE_KEY, { animals: state.animals, wardrobe, tricks, levels, hatchedIds: [...hatchedIds], eggWarmth, decor, lastSaved: Date.now() }); }
  const petDef = (id) => ANIMALS.find((a) => a.id === id);
  // Time of day drives the room's backdrop (real clock, override for tests).
  function timeOfDay() {
    const h = hourOverride != null ? hourOverride : new Date().getHours();
    if (h < 6 || h >= 20) return 'night';
    if (h < 11) return 'morning';
    if (h < 17) return 'day';
    return 'dusk';
  }
  const equippedFor = (id) => wardrobe.equipped[id] || {};
  const tricksFor = (id) => tricks[id] || [];
  const levelFor = (actionId) => Math.min(MAX_LEVEL, levels[actionId] || 1);
  // The pets currently living in the room: the starters, plus any that have
  // hatched from an egg.
  const roster = () => ANIMALS.filter((a) => STARTER_IDS.includes(a.id) || hatchedIds.has(a.id));
  // The next pet still waiting in its egg, in order (or null when all hatched).
  const nextHatch = () => HATCH.find((h) => !hatchedIds.has(h.id)) || null;
  // The mystery egg shows up once enough care wins are in for the next pet.
  const eggReady = () => { const h = nextHatch(); return h && getCounter('acWins') >= h.at ? h : null; };

  // test hook
  wrap.__ac = {
    get view() { return view; },
    get pet() { return currentPet; },
    stats: (id) => ({ ...state.animals[id].stats }),
    openDetail: (id) => showDetail(id),
    openMini: (actionId) => openMini(actionId),
    openShop: (id) => showShop(id ?? currentPet),
    openTricks: (id) => openTricks(id ?? currentPet),
    goRoom: () => showRoom(),
    equipped: (id) => ({ ...equippedFor(id) }),
    owned: () => ({ ...wardrobe.owned }),
    learnedTricks: (id) => [...tricksFor(id)],
    performTrick: () => performTrick(),
    level: (actionId) => levelFor(actionId),
    setLevel: (actionId, n) => { levels[actionId] = n; },
    roster: () => roster().map((a) => a.id),
    eggReady: () => { const h = eggReady(); return h ? h.id : null; },
    get hatched() { return [...hatchedIds]; },
    warmEgg: () => warmEgg(),
    timeOfDay: () => timeOfDay(),
    setHour: (h) => { hourOverride = h; if (view === 'room') showRoom(); },
    openDecor: () => showDecor(),
    placedDecor: () => Object.keys(decor.placed).filter((k) => decor.placed[k]),
    ownedDecor: () => ({ ...decor.owned }),
  };

  function clearView() {
    if (mgCleanup) { mgCleanup(); mgCleanup = null; }
    wrap.innerHTML = '';
    roomEls = null;
    eggEl = null;
  }

  // ---------------- ROOM ----------------
  function showRoom() {
    view = 'room';
    clearView();
    wrap.innerHTML = `
      <div class="ac-room tod-${timeOfDay()}">
        <button class="ac-decorate" aria-label="Decorate the room">🏡 Decorate</button>
        <div class="ac-wall"><div class="ac-window"><span class="ac-cloud"></span><span class="ac-cloud ac-cloud2"></span><span class="ac-sun" aria-hidden="true"></span><span class="ac-moon" aria-hidden="true"></span><span class="ac-stars" aria-hidden="true"></span></div><div class="ac-frame">🌈</div></div>
        <div class="ac-floor"><div class="ac-rug"></div></div>
        <div class="ac-decor-layer" aria-hidden="true"></div>
        <div class="ac-stage" role="group" aria-label="Your pets"></div>
      </div>
      <p class="ac-hint">Tap a pet to take care of it!</p>
    `;
    wrap.querySelector('.ac-decorate').addEventListener('click', () => { play('select'); showDecor(); });
    renderRoomDecor();
    const stage = wrap.querySelector('.ac-stage');
    roomEls = {};
    const pets = roster();
    pets.forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'ac-animal';
      btn.dataset.id = a.id;
      btn.setAttribute('aria-label', a.name + ' the ' + a.id);
      btn.innerHTML = `<span class="ac-thought" aria-hidden="true"></span><span class="ac-mood" aria-hidden="true"></span><span class="ac-name">${a.name}</span><span class="ac-art">${a.svg}</span>`;
      btn.addEventListener('click', () => { play('select'); showDetail(a.id); });
      stage.appendChild(btn);
      roomEls[a.id] = { faceEl: btn.querySelector('.ac-mood'), thoughtEl: btn.querySelector('.ac-thought'), artEl: btn.querySelector('.ac-art') };
    });
    pets.forEach((a) => refreshRoomPet(a.id));
    pets.forEach((a) => decoratePet(roomEls[a.id].artEl, equippedFor(a.id)));

    // A mystery egg joins the room once enough care has been given.
    if (eggReady()) addEgg(stage);
  }

  // ---------------- ROOM DECOR ----------------
  // Paint the placed decorations into the room at their fixed spots.
  function renderRoomDecor() {
    const layer = wrap.querySelector('.ac-decor-layer');
    if (!layer) return;
    layer.innerHTML = '';
    DECOR.forEach((d) => {
      if (!decor.placed[d.id]) return;
      const el = document.createElement('span');
      el.className = 'ac-decor';
      el.textContent = d.emoji;
      el.style.left = d.x + '%';
      el.style.top = d.y + '%';
      el.style.fontSize = d.size + 'rem';
      layer.appendChild(el);
    });
  }

  // A little shop to buy decorations with stars and place them in the room.
  function showDecor() {
    view = 'decor';
    clearView();
    wrap.innerHTML = `
      <div class="ac-shop">
        <div class="ac-shop-top">
          <button class="ac-back" aria-label="Back to room">← Room</button>
          <span class="ac-shop-title">🏡 Decorate</span>
          <span class="ac-shop-stars">⭐ <span class="ac-shop-stars-n">${getStars()}</span></span>
        </div>
        <div class="ac-shop-grid ac-decor-grid"></div>
      </div>
    `;
    wrap.querySelector('.ac-back').addEventListener('click', () => { play('select'); showRoom(); });
    const grid = wrap.querySelector('.ac-decor-grid');
    DECOR.forEach((d) => {
      const card = document.createElement('div');
      card.className = 'ac-shop-card';
      card.dataset.id = d.id;
      grid.appendChild(card);
      renderDecorCard(card, d);
    });
  }

  function renderDecorCard(card, d) {
    const owned = !!decor.owned[d.id];
    const placed = !!decor.placed[d.id];
    const enough = getStars() >= d.cost;
    let btn;
    if (!owned) btn = `<button class="ac-buy" ${enough ? '' : 'disabled'}>Buy ⭐${d.cost}</button>`;
    else if (placed) btn = `<button class="ac-equip is-on">Put away</button>`;
    else btn = `<button class="ac-equip">Place</button>`;
    card.className = 'ac-shop-card' + (placed ? ' is-worn' : '');
    card.innerHTML = `<span class="ac-shop-emoji" aria-hidden="true">${d.emoji}</span><span class="ac-shop-name">${d.name}</span>${btn}`;
    card.querySelector('button').addEventListener('click', () => onDecorAction(d));
  }

  function onDecorAction(d) {
    if (!decor.owned[d.id]) {
      if (!spendStars(d.cost)) return;
      decor.owned[d.id] = true;
      decor.placed[d.id] = true;
      unlockSticker('ac-decor');
      play('point');
    } else {
      decor.placed[d.id] = !decor.placed[d.id];
      play('select');
    }
    persist();
    const n = wrap.querySelector('.ac-shop-stars-n');
    if (n) n.textContent = getStars();
    wrap.querySelectorAll('.ac-decor-grid .ac-shop-card').forEach((card) => {
      const dd = decorById(card.dataset.id);
      if (dd) renderDecorCard(card, dd);
    });
  }

  // ---------------- MYSTERY EGG ----------------
  function addEgg(stage) {
    const h = eggReady();
    if (!h) return;
    // Keep any warmth already banked toward this egg (it's persisted, and the
    // next egg is deterministic so saved warmth always belongs to it). Only
    // start from zero when we were already warming a *different* egg this
    // session — never when eggPet is still null on a fresh mount.
    if (eggPet && eggPet !== h.id) eggWarmth = 0;
    eggPet = h.id;
    const btn = document.createElement('button');
    btn.className = 'ac-egg egg-' + eggPet;
    btn.setAttribute('aria-label', 'Mystery egg — tap to keep it warm');
    btn.innerHTML = `
      <span class="ac-egg-shell" aria-hidden="true">🥚</span>
      <span class="ac-egg-meter"><span class="ac-egg-fill"></span></span>
      <span class="ac-egg-tip">Keep me warm!</span>
    `;
    btn.addEventListener('click', () => warmEgg());
    stage.appendChild(btn);
    eggEl = btn;
    updateEgg();
    const hint = wrap.querySelector('.ac-hint');
    if (hint) hint.textContent = 'A mystery egg appeared — tap it to keep it warm!';
  }

  function updateEgg() {
    if (!eggEl) return;
    const fill = eggEl.querySelector('.ac-egg-fill');
    if (fill) fill.style.width = Math.min(1, eggWarmth / EGG_WARMTH) * 100 + '%';
  }

  function warmEgg() {
    if (!eggPet || !eggEl || hatchedIds.has(eggPet)) return;
    eggWarmth += 1;
    eggEl.classList.remove('wiggle');
    void eggEl.offsetWidth;
    eggEl.classList.add('wiggle');
    play('select');
    // a little warmth heart
    const h = document.createElement('span');
    h.className = 'ac-mini-heart';
    h.textContent = '💛';
    h.style.left = '50%';
    eggEl.appendChild(h);
    setTimeout(() => h.remove(), 900);
    updateEgg();
    persist();   // don't lose warmth if the child leaves the room
    if (eggWarmth >= EGG_WARMTH) hatchEgg();
  }

  function hatchEgg() {
    const pet = petDef(eggPet);
    hatchedIds.add(eggPet);
    eggWarmth = 0;
    unlockSticker('ac-hatch');
    if (eggPet === 'dragon') unlockSticker('ac-dragon');
    persist();
    play('happy');
    playVoice(eggPet);
    if (eggEl) {
      eggEl.classList.add('hatch');
      const boom = document.createElement('span');
      boom.className = 'ac-egg-boom';
      boom.textContent = pet ? pet.emoji : '🐣';
      eggEl.appendChild(boom);
    }
    const hatchedPet = eggPet;
    eggPet = null;
    // rebuild the room (now with the new pet) after a beat, with a welcome banner.
    setTimeout(() => {
      showRoom();
      const hint = wrap.querySelector('.ac-hint');
      if (hint && pet) hint.textContent = `${pet.name} the ${hatchedPet} hatched! ${pet.emoji} Tap to care for it!`;
    }, 1300);
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
          <span class="ac-bond" aria-label="Friendship level"></span>
          <button class="ac-tricks-btn" aria-label="Go to trick school">🎓 Tricks</button>
          <button class="ac-shop-btn" aria-label="Open dress-up shop">🛍️ Shop</button>
        </div>
        <div class="ac-detail-stage">
          <button class="ac-detail-pet" aria-label="Tap ${a.name} to see a trick">${a.svg}</button>
          <div class="ac-trick-say" role="status" aria-live="polite"></div>
        </div>
        <div class="ac-meters"></div>
        <div class="ac-actionbar" role="toolbar" aria-label="Care tasks"></div>
      </div>
    `;
    wrap.querySelector('.ac-back').addEventListener('click', () => { play('select'); showRoom(); });
    wrap.querySelector('.ac-shop-btn').addEventListener('click', () => { play('select'); showShop(id); });
    wrap.querySelector('.ac-tricks-btn').addEventListener('click', () => { play('select'); openTricks(id); });
    // Tapping a pet that has been to Trick School makes it show off a trick.
    wrap.querySelector('.ac-detail-pet').addEventListener('click', () => performTrick());

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

    renderBond(id);
    refreshMeters();
    decoratePet(wrap.querySelector('.ac-detail-pet'), equippedFor(id));
    // Invite a trick if this pet has graduated Trick School.
    if (tricksFor(id).length) {
      const say = wrap.querySelector('.ac-trick-say');
      if (say) { say.textContent = 'Tap me to see a trick!'; say.classList.add('tip'); }
    }
  }

  // Make the current pet perform a random trick it has learned. Called when the
  // child taps the big pet on the detail screen.
  function performTrick() {
    if (view !== 'detail') return;
    const learned = tricksFor(currentPet);
    if (!learned.length) return;
    const petEl = wrap.querySelector('.ac-detail-pet');
    const say = wrap.querySelector('.ac-trick-say');
    if (!petEl) return;
    const trick = TRICKS.find((t) => t.id === learned[Math.floor(Math.random() * learned.length)]);
    if (!trick) return;
    petEl.classList.remove(trick.anim);
    void petEl.offsetWidth;
    petEl.classList.add(trick.anim);
    play('happy');
    if (say) { say.textContent = `${trick.name}! ${trick.emoji}`; say.classList.remove('tip'); say.classList.add('show'); }
    setTimeout(() => { petEl.classList.remove(trick.anim); if (say) say.classList.remove('show'); }, 1100);
  }

  // Friendship badge: a heart per level (up to 5) + the level label. Grows as
  // the child plays the mini-games with this pet.
  function renderBond(id) {
    const el = wrap.querySelector('.ac-bond');
    if (!el) return;
    const b = getBond(id);
    const hearts = b.level > 0 ? '❤️'.repeat(Math.min(5, b.level)) : '🤍';
    el.innerHTML = `<span class="ac-bond-hearts" aria-hidden="true">${hearts}</span><span class="ac-bond-lv">Friends Lv ${b.level}</span>`;
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
    const petId = currentPet;
    const level = levelFor(actionId);
    mgCleanup = mg(wrap, {
      pet: petDef(petId),
      level,
      // Pay out the reward at win time; the shell shows what was earned and
      // returns the summary so it can pop stars/level/stickers on screen.
      onReward: () => award({
        stars: 3,
        bondPet: petId,
        bondXp: 10,
        counter: 'acWins',
        stickers: ['ac-first', ACTION_STICKER[act.id]].filter(Boolean),
      }),
      onWin: () => {
        const s = state.animals[petId].stats;
        s[act.primary] = 100;
        for (const k of STAT_KEYS) { if (act.restore?.[k] > 0) s[k] = clamp(s[k] + act.restore[k]); }
        // Each win nudges this game's difficulty up (capped), so it grows.
        levels[actionId] = Math.min(MAX_LEVEL, levelFor(actionId) + 1);
        persist();
        showDetail(petId);
      },
      onBack: () => showDetail(petId),
    });
    // Dress the pet inside the mini-game too, so accessories are worn everywhere.
    decoratePet(wrap.querySelector('.ac-mini-pet'), equippedFor(petId));
  }

  // ---------------- TRICK SCHOOL ----------------
  function openTricks(id) {
    view = 'mini';
    currentPet = id;
    clearView();
    const petId = id;
    mgCleanup = mountTricks(wrap, {
      pet: petDef(petId),
      onReward: () => award({
        stars: 3, bondPet: petId, bondXp: 10, counter: 'acWins',
        stickers: ['ac-first', 'ac-trick'],
      }),
      onWin: () => {
        // Graduating school teaches the pet all its tricks (to show off later).
        tricks[petId] = TRICKS.map((t) => t.id);
        state.animals[petId].stats.happiness = 100; // a good lesson is fun!
        persist();
        showDetail(petId);
      },
      onBack: () => showDetail(petId),
    });
    decoratePet(wrap.querySelector('.ac-mini-pet'), equippedFor(petId));
  }

  // ---------------- SHOP (dress-up) ----------------
  function showShop(id) {
    view = 'shop';
    currentPet = id;
    clearView();
    const a = petDef(id);
    wrap.innerHTML = `
      <div class="ac-shop">
        <div class="ac-shop-top">
          <button class="ac-back" aria-label="Back to pet">← ${a.name}</button>
          <span class="ac-shop-title">🛍️ Dress-Up Shop</span>
          <span class="ac-shop-stars">⭐ <span class="ac-shop-stars-n">${getStars()}</span></span>
        </div>
        <div class="ac-shop-stage"><span class="ac-shop-pet">${a.svg}</span></div>
        <div class="ac-shop-grid"></div>
      </div>
    `;
    wrap.querySelector('.ac-back').addEventListener('click', () => { play('select'); showDetail(id); });

    const grid = wrap.querySelector('.ac-shop-grid');
    ACCESSORIES.forEach((acc) => {
      const card = document.createElement('div');
      card.className = 'ac-shop-card';
      card.dataset.id = acc.id;
      grid.appendChild(card);
      renderShopCard(card, acc, id);
    });

    decoratePet(wrap.querySelector('.ac-shop-pet'), equippedFor(id));
  }

  function renderShopCard(card, acc, id) {
    const owned = !!wardrobe.owned[acc.id];
    const worn = equippedFor(id)[acc.slot] === acc.id;
    const enough = getStars() >= acc.cost;
    let btn;
    if (!owned) {
      btn = `<button class="ac-buy" ${enough ? '' : 'disabled'}>Buy ⭐${acc.cost}</button>`;
    } else if (worn) {
      btn = `<button class="ac-equip is-on">Take off</button>`;
    } else {
      btn = `<button class="ac-equip">Wear</button>`;
    }
    card.className = 'ac-shop-card' + (worn ? ' is-worn' : '') + (owned ? ' is-owned' : '');
    card.innerHTML = `
      <span class="ac-shop-emoji" aria-hidden="true">${acc.emoji}</span>
      <span class="ac-shop-name">${acc.name}</span>
      ${btn}
    `;
    const action = card.querySelector('button');
    action.addEventListener('click', () => onShopAction(acc, id));
  }

  function onShopAction(acc, id) {
    const owned = !!wardrobe.owned[acc.id];
    if (!owned) {
      if (!spendStars(acc.cost)) return;      // not enough stars (button is disabled anyway)
      wardrobe.owned[acc.id] = true;
      wardrobe.equipped[id][acc.slot] = acc.id; // auto-wear a freshly bought item
      unlockSticker('ac-style');
      play('point');
    } else {
      const eq = wardrobe.equipped[id];
      if (eq[acc.slot] === acc.id) delete eq[acc.slot]; // take off
      else eq[acc.slot] = acc.id;                       // wear (replaces same slot)
      play('select');
    }
    persist();
    refreshShop(id);
  }

  // Re-render the shop in place after a buy/equip so stars, buttons, and the
  // dressed pet all update.
  function refreshShop(id) {
    const n = wrap.querySelector('.ac-shop-stars-n');
    if (n) n.textContent = getStars();
    wrap.querySelectorAll('.ac-shop-card').forEach((card) => {
      const acc = accessoryById(card.dataset.id);
      if (acc) renderShopCard(card, acc, id);
    });
    decoratePet(wrap.querySelector('.ac-shop-pet'), equippedFor(id));
  }

  // ---------------- decay ticker ----------------
  const ticker = setInterval(() => {
    if (!alive) return;
    const t = Date.now();
    const elapsed = t - lastTick;
    lastTick = t;
    ANIMALS.forEach((a) => { state.animals[a.id].stats = applyDecay(state.animals[a.id].stats, elapsed); });
    if (view === 'room') {
      ANIMALS.forEach((a) => refreshRoomPet(a.id));
      // keep the backdrop in sync as the real clock moves through the day
      const room = wrap.querySelector('.ac-room');
      if (room) room.className = 'ac-room tod-' + timeOfDay();
    } else if (view === 'detail') refreshMeters();
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
