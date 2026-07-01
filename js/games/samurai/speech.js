// Thin wrapper around the Web Speech API so the game can say the target letter
// out loud. Guarded so it silently no-ops where speech isn't available
// (older browsers, headless test runs). Callers skip speaking when muted.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export function speechAvailable() {
  return !!synth && typeof window.SpeechSynthesisUtterance === 'function';
}

// Speak text with a cheerful, slightly slow kid-friendly voice.
export function speak(text) {
  if (!speechAvailable()) return;
  try {
    synth.cancel(); // don't stack utterances
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.15;
    u.volume = 1;
    synth.speak(u);
  } catch (err) {
    /* speech is a nice-to-have; never let it break the game */
  }
}

export function cancelSpeech() {
  if (!synth) return;
  try { synth.cancel(); } catch (err) { /* ignore */ }
}
