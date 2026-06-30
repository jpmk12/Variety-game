// Animal Care game controller. Builds the room, places the three animals, and
// drives the whole care loop: tap-to-select, tap-to-pet, drag-an-item-onto-a-pet,
// the four care actions, live needs feedback (mood faces, thought bubbles, and a
// needs meter for the selected pet), praise/celebration feedback, plus idle and
// per-action animations. State persists with gentle real-time decay.

import { ANIMALS } from './animals.js';
import { ACTIONS } from './actions.js';
import {
  freshStats,
  applyDecay,
  moodFor,
  lowestNeed,
  allContent,
  NEEDS,
  LOW_THRESHOLD,
  STAT_KEYS,
} from './stats.js';
import { load, save } from '../../storage.js';
import { play, playVoice } from '../../audio.js';
import { makeDraggable } from './drag.js';
import { SEQUENCES, STEP_ART } from './sequences.js';

const SAVE_KEY = 'animal-care';
const TICK_MS = 15000; // how often live decay updates the faces/meters
const IDLE_MS = 6000; // how often a random pet does a little idle flourish

const clamp = (n) => Math.max(0, Math.min(100, n));
const byId = (id) => ACTIONS.find((a) => a.id === id);

const SPECIAL_IDLES = ['idle-stretch', 'idle-sniff', 'idle-sparkle'];
const PET_SAYINGS = ['I love you!', 'Hehe!', '♥'];

export function mountAnimalCare(root) {
  // --- load + decay-on-return ---
  const saved = load(SAVE_KEY, null);
  const now = Date.now();
  const state = { animals: {}, selected: ANIMALS[0].id };

  ANIMALS.forEach((a) => {
    const prev = saved?.animals?.[a.id]?.stats;
    state.animals[a.id] = { stats: prev ? { ...freshStats(), ...prev } : freshStats() };
  });
  if (saved?.lastSaved) {
    const elapsed = now - saved.lastSaved;
    ANIMALS.forEach((a) => {
      state.animals[a.id].stats = applyDecay(state.animals[a.id].stats, elapsed);
    });
  }
  if (saved?.selected && state.animals[saved.selected]) state.selected = saved.selected;
  // Track "fully content" per pet so a celebration fires only on the transition.
  ANIMALS.forEach((a) => { state.animals[a.id].wasContent = allContent(state.animals[a.id].stats); });
  let lastTick = now;

  // --- build DOM ---
  const game = document.createElement('div');
  game.className = 'ac-game';
  game.innerHTML = `
    <div class="ac-room">
      <div class="ac-wall">
        <div class="ac-window"><span class="ac-cloud"></span><span class="ac-cloud ac-cloud2"></span></div>
        <div class="ac-frame">🌈</div>
      </div>
      <div class="ac-floor"><div class="ac-rug"></div></div>
      <div class="ac-stage" role="group" aria-label="Your pets"></div>
      <div class="ac-fx" aria-hidden="true"></div>
      <div class="ac-banner" role="status" aria-live="polite"></div>
    </div>
    <div class="ac-needs" aria-live="polite">
      <span class="ac-needs-pet"></span>
      <div class="ac-meters"></div>
    </div>
    <p class="ac-hint">Tap a pet, or drag a treat onto it!</p>
    <div class="ac-actionbar" role="toolbar" aria-label="Care actions"></div>
  `;

  const stage = game.querySelector('.ac-stage');
  const bar = game.querySelector('.ac-actionbar');
  const hint = game.querySelector('.ac-hint');
  const fxLayer = game.querySelector('.ac-fx');
  const banner = game.querySelector('.ac-banner');
  const needsPetEl = game.querySelector('.ac-needs-pet');
  const metersEl = game.querySelector('.ac-meters');

  // --- needs meter (reflects the selected pet) ---
  const meterFills = {};
  NEEDS.forEach((need) => {
    const m = document.createElement('div');
    m.className = 'ac-meter';
    m.innerHTML = `
      <span class="ac-meter-icon" aria-hidden="true">${need.icon}</span>
      <span class="ac-meter-track"><span class="ac-meter-fill"></span></span>`;
    const fill = m.querySelector('.ac-meter-fill');
    fill.style.background = need.color;
    fill.setAttribute('aria-label', need.label);
    metersEl.appendChild(m);
    meterFills[need.key] = fill;
  });

  // --- animals ---
  const els = {}; // id -> { wrap, faceEl, thoughtEl, propLayer, artEl }
  ANIMALS.forEach((a) => {
    const wrap = document.createElement('button');
    wrap.className = 'ac-animal';
    wrap.dataset.id = a.id;
    wrap.setAttribute('aria-label', a.name + ' the ' + a.id);
    wrap.innerHTML = `
      <span class="ac-thought" aria-hidden="true"></span>
      <span class="ac-queue" aria-hidden="true"></span>
      <span class="ac-mood" aria-hidden="true"></span>
      <span class="ac-name">${a.name}</span>
      <span class="ac-prop-layer"></span>
      <span class="ac-art">${a.svg}<span class="ac-overlay"></span></span>
    `;
    const refs = {
      wrap,
      faceEl: wrap.querySelector('.ac-mood'),
      thoughtEl: wrap.querySelector('.ac-thought'),
      queueEl: wrap.querySelector('.ac-queue'),
      propLayer: wrap.querySelector('.ac-prop-layer'),
      artEl: wrap.querySelector('.ac-art'),
      overlayEl: wrap.querySelector('.ac-overlay'),
      busy: false,
      queue: [],
    };
    els[a.id] = refs;

    wrap.addEventListener('click', (e) => {
      // Tapping the thought bubble fulfills the request directly.
      if (e.target.closest('.ac-thought')) {
        const need = lowestNeed(state.animals[a.id].stats);
        if (need) { doAction(byId(need.action), a.id); return; }
      }
      // Tap an unselected pet to select it; tap the selected pet to pet it.
      if (state.selected === a.id) petAnimal(a.id);
      else setSelected(a.id, { sound: true });
    });
    stage.appendChild(wrap);
  });

  // --- action buttons: tap = apply to selected, drag = drop on any pet ---
  const dragCleanups = [];
  ACTIONS.forEach((act) => {
    const btn = document.createElement('button');
    btn.className = 'ac-action';
    btn.style.setProperty('--accent', act.accent);
    btn.dataset.id = act.id;
    btn.setAttribute('aria-label', act.label);
    btn.innerHTML = `<span class="ac-action-emoji" aria-hidden="true">${act.emoji}</span><span class="ac-action-label">${act.label}</span>`;
    bar.appendChild(btn);
    dragCleanups.push(makeDraggable(btn, {
      glyph: act.emoji,
      onTap: () => doAction(act),
      onDrop: (petId) => { if (petId) doAction(act, petId); },
    }));
  });

  // --- selection ---
  function setSelected(id, { sound } = {}) {
    state.selected = id;
    ANIMALS.forEach((a) => els[a.id].wrap.classList.toggle('is-selected', a.id === id));
    if (sound) play('select');
    refreshPanel();
    persist();
  }

  // --- feedback rendering ---
  function refreshPet(id) {
    const stats = state.animals[id].stats;
    const mood = moodFor(stats);
    const { faceEl, thoughtEl, artEl, wrap } = els[id];
    faceEl.textContent = mood.face;
    wrap.dataset.mood = mood.key;
    // Don't fight an in-progress action animation with the idle droop.
    artEl.classList.toggle('is-droopy', mood.key === 'sad' && !els[id].busy);

    const need = lowestNeed(stats);
    if (need) {
      thoughtEl.textContent = need.icon;
      thoughtEl.classList.add('show');
    } else {
      thoughtEl.classList.remove('show');
    }
    if (id === state.selected) refreshPanel();
  }

  function refreshPanel() {
    const sel = ANIMALS.find((a) => a.id === state.selected);
    const stats = state.animals[state.selected].stats;
    needsPetEl.textContent = sel.name;
    NEEDS.forEach((need) => {
      const v = clamp(stats[need.key] ?? 0);
      const fill = meterFills[need.key];
      fill.style.width = v + '%';
      fill.parentElement.parentElement.classList.toggle('is-low', v < LOW_THRESHOLD);
    });
  }

  function refreshAll() { ANIMALS.forEach((a) => refreshPet(a.id)); }

  // --- the core care action ---
  const MAX_QUEUE = 4;
  function doAction(act, petId = state.selected) {
    const id = petId;
    if (id !== state.selected) setSelected(id);
    const refs = els[id];
    // Mid-sequence? Queue the tap so it runs next instead of being dropped.
    if (refs.busy) {
      if (refs.queue.length < MAX_QUEUE) {
        refs.queue.push(act);
        bumpQueueBadge(id);
      }
      return;
    }
    const stats = state.animals[id].stats;
    hint.classList.add('is-hidden');

    // Already satisfied for this action's primary need → gentle "full" reaction.
    if ((stats[act.primary] ?? 100) >= 98) {
      stats.happiness = clamp(stats.happiness + 3);
      restartAnim(refs.artEl, 'is-full', 600);
      say(id, act.fullMessage);
      play('select');
      refreshPet(id);
      persist();
      return;
    }

    // Apply the restore up front so the meter fills, then play out the sequence.
    for (const k of STAT_KEYS) {
      if (act.restore[k]) stats[k] = clamp(stats[k] + act.restore[k]);
    }
    refreshPet(id);
    const content = allContent(stats);
    refs.pendingCelebrate = content && !state.animals[id].wasContent;
    state.animals[id].wasContent = content;
    persist();

    runSequence(id, act);
  }

  // Swap the pet's body-motion class, restarting the animation cleanly.
  function setArt(artEl, cls) {
    artEl.classList.remove(...STEP_ART);
    void artEl.offsetWidth; // reflow → restart
    if (cls) artEl.classList.add(cls);
  }

  // Play the ordered steps of an action one after another.
  async function runSequence(id, act) {
    const refs = els[id];
    const { artEl, overlayEl, propLayer } = refs;
    const steps = SEQUENCES[act.id] || [
      { ms: 700, art: act.anim, particle: act.particle, count: 6, sound: act.sound, say: true, celebrate: true },
    ];
    refs.busy = true;
    for (const step of steps) {
      if (!alive) break;
      setArt(artEl, step.art);
      overlayEl.className = 'ac-overlay' + (step.overlay ? ' ' + step.overlay : '');
      if (step.prop) spawnProp(propLayer, act);
      if (step.particle) sprayParticles(propLayer, step.particle, step.count || 5);
      if (step.sound) play(step.sound);
      if (step.voice) playVoice(id);
      if (step.say) say(id, act.praise);
      if (step.celebrate && refs.pendingCelebrate) { celebrate(id); refs.pendingCelebrate = false; }
      await sleep(step.ms);
    }
    // settle back to idle
    artEl.classList.remove(...STEP_ART);
    overlayEl.className = 'ac-overlay';
    refs.busy = false;
    if (alive) refreshPet(id);

    // Run the next queued tap, if any.
    if (alive && refs.queue.length) {
      const next = refs.queue.shift();
      bumpQueueBadge(id);
      doAction(next, id);
    }
  }

  // --- petting (tap the already-selected pet) ---
  function petAnimal(id) {
    if (els[id].busy) return; // not mid-action
    const stats = state.animals[id].stats;
    stats.happiness = clamp(stats.happiness + 8);
    restartAnim(els[id].artEl, 'is-cuddle', 700);
    sprayParticles(els[id].propLayer, '❤️', 4);
    playVoice(id);
    say(id, PET_SAYINGS[Math.floor(Math.random() * PET_SAYINGS.length)]);
    refreshPet(id);
    persist();
  }

  // --- celebration ---
  function celebrate(id) {
    const name = ANIMALS.find((a) => a.id === id).name;
    restartAnim(els[id].artEl, 'is-dancing', 1200);
    banner.textContent = `${name} is so happy! 🎉`;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 2200);
    spawnConfetti(28);
    play('happy');
    setTimeout(() => playVoice(id), 180);
  }

  // Show how many taps are waiting their turn on a pet ("+2").
  function bumpQueueBadge(id) {
    const { queueEl, queue } = els[id];
    if (queue.length > 0) {
      queueEl.textContent = '+' + queue.length;
      queueEl.classList.add('show');
    } else {
      queueEl.classList.remove('show');
    }
  }

  // --- small effect helpers ---
  function restartAnim(artEl, cls, ms) {
    artEl.classList.remove(cls);
    void artEl.offsetWidth;
    artEl.classList.add(cls);
    setTimeout(() => artEl.classList.remove(cls), ms);
  }

  // A short message that floats up from the pet.
  function say(id, text) {
    const el = document.createElement('span');
    el.className = 'ac-say';
    el.textContent = text;
    els[id].wrap.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  // A big prop (bowl / ball / bubbles) that pops in near the pet then fades.
  function spawnProp(layer, act) {
    const prop = document.createElement('span');
    prop.className = 'ac-prop ac-prop-' + act.id;
    prop.textContent = act.emoji;
    layer.appendChild(prop);
    setTimeout(() => prop.remove(), 1500);
  }

  // Little emoji particles floating up (hearts, bubbles, stars...).
  function sprayParticles(layer, glyph, count) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'ac-particle';
      p.textContent = glyph;
      p.style.left = 30 + Math.random() * 40 + '%';
      p.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
      p.style.animationDelay = i * 60 + 'ms';
      layer.appendChild(p);
      setTimeout(() => p.remove(), 1600 + i * 60);
    }
  }

  // Colorful confetti rain across the whole room.
  const CONFETTI_COLORS = ['#ff6b9d', '#ffd166', '#5ec8ff', '#9be7c4', '#bdb2ff', '#ff9f68'];
  function spawnConfetti(count) {
    for (let i = 0; i < count; i++) {
      const c = document.createElement('span');
      c.className = 'ac-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      fxLayer.appendChild(c);
      setTimeout(() => c.remove(), 2400);
    }
  }

  function persist() {
    save(SAVE_KEY, {
      animals: state.animals,
      selected: state.selected,
      lastSaved: Date.now(),
    });
  }

  // --- sequence timing: cancellable sleeps so leaving the game stops cleanly ---
  let alive = true;
  const timers = new Set();
  function sleep(ms) {
    return new Promise((resolve) => {
      const t = setTimeout(() => { timers.delete(t); resolve(); }, ms);
      timers.add(t);
    });
  }

  // --- timers: live decay + occasional idle flourishes ---
  const ticker = setInterval(() => {
    const t = Date.now();
    const elapsed = t - lastTick;
    lastTick = t;
    ANIMALS.forEach((a) => {
      state.animals[a.id].stats = applyDecay(state.animals[a.id].stats, elapsed);
      // decay can drop a pet out of "content"
      state.animals[a.id].wasContent = allContent(state.animals[a.id].stats);
    });
    refreshAll();
    persist();
  }, TICK_MS);

  const idleTimer = setInterval(() => {
    const idleOnes = ANIMALS.filter((a) => !els[a.id].busy
      && !SPECIAL_IDLES.some((c) => els[a.id].artEl.classList.contains(c)));
    if (!idleOnes.length) return;
    const a = idleOnes[Math.floor(Math.random() * idleOnes.length)];
    const cls = SPECIAL_IDLES[Math.floor(Math.random() * SPECIAL_IDLES.length)];
    const art = els[a.id].artEl;
    art.classList.add(cls);
    art.addEventListener('animationend', () => art.classList.remove(cls), { once: true });
    setTimeout(() => art.classList.remove(cls), 1600);
  }, IDLE_MS);

  // --- initial paint ---
  refreshAll();
  setSelected(state.selected);
  root.appendChild(game);

  // --- cleanup when leaving the game ---
  return function unmount() {
    alive = false;
    clearInterval(ticker);
    clearInterval(idleTimer);
    timers.forEach(clearTimeout);
    timers.clear();
    dragCleanups.forEach((fn) => fn());
    persist();
    game.remove();
  };
}
