// Tiny wrapper around localStorage so every module saves/loads the same way
// and a private/blocked storage never crashes the game.

const PREFIX = 'funhub:';

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    // Storage may be full or disabled (private mode). Game still plays,
    // it just won't remember between sessions.
    return false;
  }
}
