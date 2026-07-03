// Sound manager. Sounds are synthesized with the Web Audio API so there are no
// audio files to ship. Each effect is a short sequence of cheerful tones.
// Mute state persists across sessions.

import { load, save } from './storage.js';

let ctx = null;
let muted = load('muted', false);

// Listeners so the UI (mute button) can reflect state changes.
const listeners = new Set();

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

// Browsers block audio until a user gesture. Call this from any tap. We resume
// whenever the context isn't actively running — that covers 'suspended' (before
// the first gesture) and iOS Safari's 'interrupted' state (after a call, screen
// lock, or the tab being backgrounded), both of which otherwise leave the game
// silent until the context is nudged back to life.
export function unlock() {
  const c = ensureCtx();
  if (c && c.state !== 'running' && typeof c.resume === 'function') c.resume();
}

export function isMuted() {
  return muted;
}

export function onMuteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toggleMute() {
  muted = !muted;
  save('muted', muted);
  listeners.forEach((fn) => fn(muted));
  return muted;
}

// Play one tone. type/freq/duration shape the character of the blip.
function tone({ freq, start, duration, type = 'sine', gain = 0.18, slideTo = null }) {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);

  // Quick attack, smooth release so it never clicks.
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(env).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Filtered noise burst — used for splashy / watery effects.
function noise({ start, duration, gain = 0.12, freq = 1000 }) {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const frames = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // Fade the noise out so it sounds like a settling splash.
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const env = c.createGain();
  env.gain.value = gain;
  src.connect(filter).connect(env).connect(c.destination);
  src.start(t0);
}

// Named effects, each a recipe of tones/noise.
const EFFECTS = {
  select: () => tone({ freq: 660, start: 0, duration: 0.12, type: 'triangle' }),
  feed: () => {
    tone({ freq: 300, start: 0, duration: 0.08, type: 'square', gain: 0.12 });
    tone({ freq: 360, start: 0.1, duration: 0.08, type: 'square', gain: 0.12 });
    tone({ freq: 320, start: 0.2, duration: 0.08, type: 'square', gain: 0.12 });
  },
  water: () => {
    noise({ start: 0, duration: 0.3, gain: 0.1, freq: 1400 });
    tone({ freq: 500, start: 0.05, duration: 0.25, type: 'sine', gain: 0.08, slideTo: 900 });
  },
  bath: () => {
    noise({ start: 0, duration: 0.45, gain: 0.08, freq: 2200 });
    tone({ freq: 700, start: 0.2, duration: 0.2, type: 'sine', gain: 0.07, slideTo: 1500 });
  },
  play: () => {
    tone({ freq: 523, start: 0, duration: 0.1, type: 'triangle' });
    tone({ freq: 659, start: 0.1, duration: 0.1, type: 'triangle' });
    tone({ freq: 784, start: 0.2, duration: 0.14, type: 'triangle' });
  },
  brush: () => {
    // soft grooming swishes
    noise({ start: 0, duration: 0.18, gain: 0.07, freq: 2600 });
    noise({ start: 0.22, duration: 0.18, gain: 0.07, freq: 2600 });
    noise({ start: 0.44, duration: 0.2, gain: 0.07, freq: 2600 });
  },
  night: () => {
    // a gentle, descending lullaby
    tone({ freq: 660, start: 0, duration: 0.3, type: 'sine', gain: 0.12 });
    tone({ freq: 550, start: 0.28, duration: 0.34, type: 'sine', gain: 0.12 });
    tone({ freq: 440, start: 0.6, duration: 0.45, type: 'sine', gain: 0.12 });
  },
  happy: () => {
    tone({ freq: 784, start: 0, duration: 0.12, type: 'sine', gain: 0.16 });
    tone({ freq: 1046, start: 0.12, duration: 0.18, type: 'sine', gain: 0.16 });
  },
  // a magical sparkle for tap surprises (window/rainbow)
  twinkle: () => {
    tone({ freq: 988, start: 0, duration: 0.09, type: 'triangle', gain: 0.13 });
    tone({ freq: 1319, start: 0.08, duration: 0.09, type: 'triangle', gain: 0.13 });
    tone({ freq: 1760, start: 0.16, duration: 0.14, type: 'sine', gain: 0.12 });
  },

  // --- Samurai game ---
  // slice: a quick blade whoosh
  slice: () => {
    noise({ start: 0, duration: 0.14, gain: 0.12, freq: 3200 });
    tone({ freq: 1200, start: 0, duration: 0.1, type: 'sine', gain: 0.06, slideTo: 400 });
  },
  // point: a bright correct-answer ding
  point: () => {
    tone({ freq: 880, start: 0, duration: 0.1, type: 'triangle', gain: 0.16 });
    tone({ freq: 1319, start: 0.09, duration: 0.16, type: 'triangle', gain: 0.16 });
  },
  // oops: a soft, non-scary "not that one"
  oops: () => {
    tone({ freq: 320, start: 0, duration: 0.16, type: 'sine', gain: 0.12, slideTo: 220 });
  },

  // --- Climb & Spell ---
  // thwip: a web-shot whoosh for swinging
  thwip: () => {
    noise({ start: 0, duration: 0.16, gain: 0.1, freq: 2600 });
    tone({ freq: 700, start: 0, duration: 0.14, type: 'sine', gain: 0.06, slideTo: 1500 });
  },
  // crawl: a soft double scuttle for crawling
  crawl: () => {
    tone({ freq: 260, start: 0, duration: 0.06, type: 'triangle', gain: 0.08 });
    tone({ freq: 240, start: 0.09, duration: 0.06, type: 'triangle', gain: 0.08 });
  },

  // --- distinct animal voices ---
  // dog: two short low "woof" barks
  'voice-dog': () => {
    tone({ freq: 190, start: 0, duration: 0.12, type: 'square', gain: 0.16, slideTo: 120 });
    tone({ freq: 170, start: 0.18, duration: 0.14, type: 'square', gain: 0.16, slideTo: 110 });
  },
  // cat: a "meow" that rises then falls
  'voice-cat': () => {
    tone({ freq: 620, start: 0, duration: 0.16, type: 'sawtooth', gain: 0.12, slideTo: 950 });
    tone({ freq: 900, start: 0.16, duration: 0.22, type: 'sawtooth', gain: 0.12, slideTo: 520 });
  },
  // unicorn: a sparkly little arpeggio
  'voice-unicorn': () => {
    tone({ freq: 660, start: 0, duration: 0.1, type: 'triangle', gain: 0.14 });
    tone({ freq: 880, start: 0.09, duration: 0.1, type: 'triangle', gain: 0.14 });
    tone({ freq: 1175, start: 0.18, duration: 0.12, type: 'triangle', gain: 0.14 });
    tone({ freq: 1568, start: 0.28, duration: 0.18, type: 'sine', gain: 0.12 });
  },
  // bunny: a cute springy "boing-boing"
  'voice-bunny': () => {
    tone({ freq: 400, start: 0, duration: 0.14, type: 'sine', gain: 0.14, slideTo: 900 });
    tone({ freq: 500, start: 0.16, duration: 0.16, type: 'sine', gain: 0.14, slideTo: 1100 });
  },
};

export function play(name) {
  if (muted) return;
  unlock();
  const fx = EFFECTS[name];
  if (fx) fx();
}

// Play a single musical note now (respects mute, shares the AudioContext).
// Reusable building block for games that make music, like Beat Buddies.
export function playNote(freq, opts = {}) {
  if (muted) return;
  unlock();
  const { type = 'sine', gain = 0.18, duration = 0.3, slideTo = null } = opts;
  tone({ freq, start: 0, duration, type, gain, slideTo });
}

// Play an animal's signature voice (falls back silently if unknown).
export function playVoice(animalId) {
  play('voice-' + animalId);
}
