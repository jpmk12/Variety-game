// Animal Care game controller. Builds the room, places the three animals, wires
// tap-to-select + the four care actions, drives stats/mood, and persists state.

import { ANIMALS } from './animals.js';
import { ACTIONS } from './actions.js';
import {
  freshStats,
  applyDecay,
  moodFor,
  STAT_KEYS,
} from './stats.js';
import { load, save } from '../../storage.js';
import { play } from '../../audio.js';

const SAVE_KEY = 'animal-care';
const TICK_MS = 15000; // how often live decay updates the mood faces

const clamp = (n) => Math.max(0, Math.min(100, n));

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
    </div>
    <p class="ac-hint">Tap a pet, then pick a task below!</p>
    <div class="ac-actionbar" role="toolbar" aria-label="Care actions"></div>
  `;

  const stage = game.querySelector('.ac-stage');
  const bar = game.querySelector('.ac-actionbar');
  const hint = game.querySelector('.ac-hint');

  // --- animals ---
  const els = {}; // id -> { wrap, faceEl, propLayer }
  ANIMALS.forEach((a) => {
    const wrap = document.createElement('button');
    wrap.className = 'ac-animal';
    wrap.dataset.id = a.id;
    wrap.setAttribute('aria-label', a.name + ' the ' + a.id);
    wrap.innerHTML = `
      <span class="ac-mood" aria-hidden="true"></span>
      <span class="ac-name">${a.name}</span>
      <span class="ac-prop-layer"></span>
      <span class="ac-art">${a.svg}</span>
    `;
    wrap.addEventListener('click', () => selectAnimal(a.id));
    stage.appendChild(wrap);
    els[a.id] = {
      wrap,
      faceEl: wrap.querySelector('.ac-mood'),
      propLayer: wrap.querySelector('.ac-prop-layer'),
      artEl: wrap.querySelector('.ac-art'),
    };
  });

  // --- action buttons ---
  ACTIONS.forEach((act) => {
    const btn = document.createElement('button');
    btn.className = 'ac-action';
    btn.style.setProperty('--accent', act.accent);
    btn.dataset.id = act.id;
    btn.setAttribute('aria-label', act.label);
    btn.innerHTML = `<span class="ac-action-emoji" aria-hidden="true">${act.emoji}</span><span class="ac-action-label">${act.label}</span>`;
    btn.addEventListener('click', () => doAction(act));
    bar.appendChild(btn);
  });

  // --- behaviour ---
  function selectAnimal(id) {
    state.selected = id;
    ANIMALS.forEach((a) => els[a.id].wrap.classList.toggle('is-selected', a.id === id));
    play('select');
    persist();
  }

  function refreshMood(id) {
    const mood = moodFor(state.animals[id].stats);
    const { faceEl, wrap } = els[id];
    faceEl.textContent = mood.face;
    wrap.dataset.mood = mood.key;
  }

  function doAction(act) {
    const id = state.selected;
    const { wrap, propLayer, artEl } = els[id];

    // Apply stat changes.
    const stats = state.animals[id].stats;
    for (const k of STAT_KEYS) {
      if (act.restore[k]) stats[k] = clamp(stats[k] + act.restore[k]);
    }

    // Animation: toggle the action class on the SVG wrapper, then a happy hop.
    artEl.classList.remove(...ACTIONS.map((a) => a.anim), 'is-happy');
    // reflow so re-adding the same class restarts the animation
    void artEl.offsetWidth;
    artEl.classList.add(act.anim);

    play(act.sound);
    spawnProp(propLayer, act);
    sprayParticles(propLayer, act.particle, act.id === 'play' ? 8 : 6);

    const onEnd = () => {
      artEl.classList.remove(act.anim);
      artEl.classList.add('is-happy');
      play('happy');
      setTimeout(() => artEl.classList.remove('is-happy'), 700);
    };
    artEl.addEventListener('animationend', onEnd, { once: true });
    // Fallback in case animationend doesn't fire (reduced motion).
    setTimeout(() => artEl.classList.remove(act.anim), 1400);

    refreshMood(id);
    hint.classList.add('is-hidden');
    persist();
  }

  // A big prop (bowl / ball) that pops in near the animal then fades.
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

  function persist() {
    save(SAVE_KEY, {
      animals: state.animals,
      selected: state.selected,
      lastSaved: Date.now(),
    });
  }

  // Live decay so faces gently shift while playing.
  const ticker = setInterval(() => {
    const t = Date.now();
    const elapsed = t - lastTick;
    lastTick = t;
    ANIMALS.forEach((a) => {
      state.animals[a.id].stats = applyDecay(state.animals[a.id].stats, elapsed);
      refreshMood(a.id);
    });
    persist();
  }, TICK_MS);

  // initial paint
  ANIMALS.forEach((a) => refreshMood(a.id));
  selectAnimal(state.selected);
  root.appendChild(game);

  // Cleanup when leaving the game.
  return function unmount() {
    clearInterval(ticker);
    persist();
    game.remove();
  };
}
