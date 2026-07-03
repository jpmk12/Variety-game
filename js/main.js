// App shell + router. Swaps between the hub menu and an active game, and wires
// up the global Back and Mute buttons in the top bar.

import { renderHub } from './hub.js';
import { isMuted, toggleMute, onMuteChange, unlock, play } from './audio.js';

const app = document.getElementById('app');
const backBtn = document.getElementById('backBtn');
const muteBtn = document.getElementById('muteBtn');
const topTitle = document.getElementById('topTitle');

let activeUnmount = null; // cleanup fn for the running game, if any

function showHub() {
  if (activeUnmount) {
    activeUnmount();
    activeUnmount = null;
  }
  backBtn.hidden = true;
  topTitle.textContent = 'Fun Game Hub';
  document.body.classList.remove('in-game');
  renderHub(app, launchGame);
}

function launchGame(game) {
  unlock(); // first gesture — lets audio play
  play('select');
  if (activeUnmount) activeUnmount();
  app.innerHTML = '';
  backBtn.hidden = false;
  topTitle.textContent = game.title;
  document.body.classList.add('in-game');
  // Each game's mount returns an optional unmount() for cleanup.
  activeUnmount = game.mount(app) || null;
}

// --- Mute button state ---
function syncMuteBtn(muted) {
  muteBtn.setAttribute('aria-pressed', String(muted));
  muteBtn.classList.toggle('is-muted', muted);
  muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
}
syncMuteBtn(isMuted());
onMuteChange(syncMuteBtn);
muteBtn.addEventListener('click', () => {
  unlock();
  toggleMute();
});

backBtn.addEventListener('click', showHub);

// Audio safety net: the Web Audio context can start blocked (before any gesture)
// and gets suspended when the tab is backgrounded or the device sleeps. Resume
// it on ANY interaction and whenever the page becomes visible again, so sound
// isn't silently lost no matter where the first tap lands.
['pointerdown', 'touchstart', 'keydown'].forEach((ev) =>
  window.addEventListener(ev, () => unlock(), { passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden) unlock(); });

showHub();
