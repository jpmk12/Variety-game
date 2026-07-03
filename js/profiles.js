// Kid profiles — so siblings each get their own pets, stars, and stickers.
// Every game save is namespaced by the active profile (see storage.js). The
// first profile ("p1") deliberately uses the un-prefixed legacy keys, so a
// child who was already playing keeps everything they earned for free; any
// extra profile stores under `funhub:<id>:<key>`.

const PROFILES_KEY = 'funhub:__profiles';
const ACTIVE_KEY = 'funhub:__active';

export const DEFAULT_ID = 'p1';
const MAX = 3;

// A friendly palette of avatars kids pick from when making a new profile.
export const PROFILE_AVATARS = ['🐶', '🐱', '🦄', '🐰', '🐲', '🦊', '🐼', '🐸', '🐥', '🦋'];

function readRaw(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeRaw(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

// Make sure a default profile always exists, so the very first visit has an
// identity to save under (and legacy players are folded into it seamlessly).
function ensureDefault() {
  let list = readRaw(PROFILES_KEY, null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [{ id: DEFAULT_ID, name: 'Player 1', avatar: '🐶' }];
    writeRaw(PROFILES_KEY, list);
  }
  return list;
}

export function getProfiles() {
  return ensureDefault();
}

export function getActiveId() {
  const list = ensureDefault();
  const active = readRaw(ACTIVE_KEY, null);
  if (active && list.some((p) => p.id === active)) return active;
  return list[0].id;
}

export function getActive() {
  const list = ensureDefault();
  const id = getActiveId();
  return list.find((p) => p.id === id) || list[0];
}

export function setActive(id) {
  const list = ensureDefault();
  if (!list.some((p) => p.id === id)) return false;
  return writeRaw(ACTIVE_KEY, id);
}

export function maxProfiles() {
  return MAX;
}

export function canAddProfile() {
  return ensureDefault().length < MAX;
}

// Create a new profile with the given name + avatar and make it active.
// Returns the new profile, or null if we're already at the cap.
export function addProfile(name, avatar) {
  const list = ensureDefault();
  if (list.length >= MAX) return null;
  // Find a free id slot (p1..p3) so ids stay stable + short.
  let id = null;
  for (let i = 1; i <= MAX; i++) {
    if (!list.some((p) => p.id === 'p' + i)) { id = 'p' + i; break; }
  }
  if (!id) return null;
  const clean = (name || '').trim().slice(0, 12) || 'Player ' + list.length;
  const profile = { id, name: clean, avatar: avatar || PROFILE_AVATARS[0] };
  list.push(profile);
  writeRaw(PROFILES_KEY, list);
  writeRaw(ACTIVE_KEY, id);
  return profile;
}
