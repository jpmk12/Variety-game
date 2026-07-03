// Tiny wrapper around localStorage so every module saves/loads the same way
// and a private/blocked storage never crashes the game. Every key is scoped to
// the active kid profile — the default profile keeps the original un-prefixed
// keys so existing saves carry over untouched (see profiles.js).

import { getActiveId, DEFAULT_ID } from './profiles.js';

const PREFIX = 'funhub:';

function keyFor(key) {
  const id = getActiveId();
  // Default profile uses the legacy layout ("funhub:progress"); extra profiles
  // get their own slice ("funhub:p2:progress").
  const scope = id && id !== DEFAULT_ID ? id + ':' : '';
  return PREFIX + scope + key;
}

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(keyFor(key));
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(keyFor(key), JSON.stringify(value));
    return true;
  } catch (err) {
    // Storage may be full or disabled (private mode). Game still plays,
    // it just won't remember between sessions.
    return false;
  }
}
