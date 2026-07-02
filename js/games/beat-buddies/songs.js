// Beat Buddies content: the three band members (one per lane) with their
// synthesized instruments, plus a couple of data-driven songs. Each song is a
// list of { b: beat, l: lane } hits; the controller turns beats into seconds
// using the song's bpm.

import { playNote } from '../../audio.js';

// Lane order = which pet plays in each column, left to right.
export const LANES = ['dog', 'cat', 'unicorn'];

// Per-pet instrument. `scale` is the notes it cycles through as it's played, so
// repeated taps sound like a little melody rather than one flat note.
export const INSTRUMENTS = {
  dog:     { emoji: '🥁', label: 'Drums',  color: '#ff9f68', type: 'square',   gain: 0.20, dur: 0.20, slide: 0.5, scale: [147, 110, 165, 131] },
  cat:     { emoji: '🎹', label: 'Piano',  color: '#ff6b9d', type: 'triangle', gain: 0.16, dur: 0.32, slide: 1,   scale: [523, 587, 659, 784, 880] },
  unicorn: { emoji: '🔔', label: 'Chimes', color: '#bdb2ff', type: 'sine',     gain: 0.13, dur: 0.50, slide: 1,   scale: [784, 880, 1047, 1319, 1568] },
};

// Play a pet's instrument at the given step in its scale (wraps around).
export function playInstrument(petId, step) {
  const inst = INSTRUMENTS[petId];
  if (!inst) return;
  const freq = inst.scale[step % inst.scale.length];
  playNote(freq, { type: inst.type, gain: inst.gain, duration: inst.dur, slideTo: inst.slide !== 1 ? freq * inst.slide : null });
}

export const SONGS = [
  {
    id: 'puppy-parade', name: 'Puppy Parade', emoji: '🐶', bpm: 84,
    beats: [
      { b: 0, l: 0 }, { b: 1, l: 1 }, { b: 2, l: 0 }, { b: 3, l: 1 },
      { b: 4, l: 0 }, { b: 5, l: 2 }, { b: 6, l: 0 }, { b: 7, l: 1 },
      { b: 8, l: 0 }, { b: 9, l: 1 }, { b: 10, l: 2 }, { b: 11, l: 1 },
      { b: 12, l: 0 }, { b: 13, l: 1 }, { b: 14, l: 2 }, { b: 15, l: 0 },
    ],
  },
  {
    id: 'rainbow-march', name: 'Rainbow March', emoji: '🌈', bpm: 110,
    beats: [
      { b: 0, l: 2 }, { b: 1, l: 1 }, { b: 2, l: 0 }, { b: 2.5, l: 1 }, { b: 3, l: 2 },
      { b: 4, l: 0 }, { b: 5, l: 1 }, { b: 5.5, l: 2 }, { b: 6, l: 0 }, { b: 7, l: 1 },
      { b: 8, l: 2 }, { b: 8.5, l: 1 }, { b: 9, l: 0 }, { b: 10, l: 1 }, { b: 11, l: 2 },
      { b: 11.5, l: 0 }, { b: 12, l: 1 }, { b: 13, l: 2 }, { b: 14, l: 0 }, { b: 14.5, l: 1 }, { b: 15, l: 2 },
    ],
  },
];

// Turn a song's beats into timed notes (seconds). Free Jam has no notes.
export function songNotes(song) {
  if (!song || song.freeJam || !song.beats) return [];
  const spb = 60 / song.bpm;
  return song.beats
    .map((n) => ({ time: n.b * spb, lane: n.l }))
    .sort((a, b) => a.time - b.time);
}
