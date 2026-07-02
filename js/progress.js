// Shared player progress — the reward economy that every game plugs into.
// Tracks a global ⭐ star wallet, per-pet friendship "bond" (XP + level),
// unlocked stickers, and lifetime counters used to unlock milestone stickers.
// Persists to localStorage and notifies subscribers so any open UI updates live.

import { load, save } from './storage.js';
import { STICKERS } from './stickers.js';

const KEY = 'progress';

// XP needed to advance FROM level n TO n+1 grows gently: 10, 20, 30, …
// A single mini-game win is ~10 XP, so early levels come fast then slow down.
function levelForXp(xp) {
  let level = 1;
  let need = 10;
  let acc = 0;
  while (xp >= acc + need) { acc += need; level += 1; need += 10; }
  return { level, into: xp - acc, need };
}

function fresh() {
  return { stars: 0, bond: {}, stickers: {}, counters: {} };
}

// Load once and keep an in-memory copy; every mutation persists + emits.
let state = { ...fresh(), ...(load(KEY, null) || {}) };
state.bond = state.bond || {};
state.stickers = state.stickers || {};
state.counters = state.counters || {};

const subs = new Set();
export function onProgressChange(fn) { subs.add(fn); return () => subs.delete(fn); }
function emit() { save(KEY, state); subs.forEach((fn) => { try { fn(state); } catch (_) {} }); }

// --- reads ---
export function getStars() { return state.stars; }
export function getBond(petId) {
  const xp = state.bond[petId] || 0;
  return { xp, ...levelForXp(xp) };
}
export function hasSticker(id) { return !!state.stickers[id]; }
export function getStickers() { return { ...state.stickers }; }
export function getCounter(key) { return state.counters[key] || 0; }
export function snapshot() { return JSON.parse(JSON.stringify(state)); }

// How many stickers in a group are earned (for hub progress hints).
export function groupProgress(group) {
  const all = STICKERS.filter((s) => s.group === group);
  const got = all.filter((s) => state.stickers[s.id]).length;
  return { got, total: all.length };
}

// --- writes ---
export function addStars(n) {
  state.stars = Math.max(0, state.stars + n);
  emit();
  return state.stars;
}
export function spendStars(n) {
  if (state.stars < n) return false;
  state.stars -= n;
  emit();
  return true;
}
export function bumpCounter(key, n = 1) {
  state.counters[key] = (state.counters[key] || 0) + n;
  emit();
  return state.counters[key];
}
// Unlock a sticker; returns true only the first time (so callers can celebrate).
export function unlockSticker(id) {
  if (state.stickers[id]) return false;
  state.stickers[id] = true;
  emit();
  return true;
}

// The one call games use after a success. Applies stars, bond XP, a counter
// bump, and any named stickers — plus auto-checks milestone stickers keyed off
// the star wallet and counters. Returns a summary the caller can show off.
//   award({ stars, bondPet, bondXp, counter, stickers: ['id', …] })
export function award(opts = {}) {
  const summary = { stars: 0, newStickers: [], leveledUp: false, level: 0 };

  if (opts.counter) bumpCounter(opts.counter, opts.counterBy || 1);

  if (opts.bondPet && opts.bondXp) {
    const before = getBond(opts.bondPet).level;
    state.bond[opts.bondPet] = (state.bond[opts.bondPet] || 0) + opts.bondXp;
    const after = getBond(opts.bondPet).level;
    summary.level = after;
    if (after > before) summary.leveledUp = true;
  }

  if (opts.stars) { state.stars = Math.max(0, state.stars + opts.stars); summary.stars = opts.stars; }

  const wanted = [].concat(opts.stickers || []);
  for (const id of wanted) {
    if (!state.stickers[id]) { state.stickers[id] = true; summary.newStickers.push(id); }
  }

  // Auto-unlock the "condition" stickers (milestones on stars/counters/bond).
  for (const s of STICKERS) {
    if (state.stickers[s.id] || !s.when) continue;
    if (s.when(state, { getBond })) { state.stickers[s.id] = true; summary.newStickers.push(s.id); }
  }

  emit();
  return summary;
}

// Test/inspection hook.
if (typeof window !== 'undefined') {
  window.__progress = { snapshot, award, getStars, getBond, getStickers, getCounter };
}
