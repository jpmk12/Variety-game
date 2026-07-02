// Trick School: a gentle "learn a trick" game. The teacher names a trick, the
// pet demos it, and the matching trick button glows — the child taps it and the
// pet performs. Five good reps graduates the pet, which then knows all its
// tricks (and will show them off when tapped back on the pet screen).

import { createShell } from './shell.js';
import { play } from '../../../audio.js';

// The four tricks. `anim` is the CSS class that makes the pet perform it — the
// same classes are reused on the detail screen when a learned pet shows off.
export const TRICKS = [
  { id: 'sit',   name: 'Sit',   emoji: '⬇️', anim: 'mg-trick-sit' },
  { id: 'spin',  name: 'Spin',  emoji: '🌀', anim: 'mg-trick-spin' },
  { id: 'jump',  name: 'Jump',  emoji: '⬆️', anim: 'mg-trick-jump' },
  { id: 'shake', name: 'Shake', emoji: '🤝', anim: 'mg-trick-shake' },
];

const TARGET = 5;

export function mountTricks(host, ctx) {
  const shell = createShell(host, {
    title: `${ctx.pet.name}'s Trick School`, icon: '🎓', color: '#ffb84d', meterIcon: '🎓',
    pet: ctx.pet, petId: ctx.pet.id, winPraise: 'Good job! 🎉',
    onWin: ctx.onWin, onBack: ctx.onBack, onReward: ctx.onReward,
  });

  let done = 0;
  let target = null;
  let prev = null;

  // trick buttons
  const row = document.createElement('div');
  row.className = 'ac-trick-row';
  const btns = {};
  TRICKS.forEach((t) => {
    const b = document.createElement('button');
    b.className = 'ac-trick-btn';
    b.dataset.id = t.id;
    b.innerHTML = `<span class="ac-trick-emoji" aria-hidden="true">${t.emoji}</span><span class="ac-trick-name">${t.name}</span>`;
    b.addEventListener('click', () => onPick(t));
    row.appendChild(b);
    btns[t.id] = b;
  });
  shell.stage.appendChild(row);

  function perform(t) {
    shell.petEl.classList.remove(t.anim);
    void shell.petEl.offsetWidth; // restart the animation
    shell.petEl.classList.add(t.anim);
    shell.later(() => shell.petEl.classList.remove(t.anim), 900);
  }

  function next() {
    if (shell.isWon()) return;
    // pick a different trick than last time so it feels varied
    do { target = TRICKS[Math.floor(Math.random() * TRICKS.length)]; } while (target === prev && TRICKS.length > 1);
    prev = target;
    shell.setHint(`Teach “${target.name}”! Tap the glowing button.`);
    perform(target);
    Object.values(btns).forEach((b) => b.classList.remove('is-target'));
    btns[target.id].classList.add('is-target');
  }

  function onPick(t) {
    if (shell.isWon() || !target) return;
    if (t.id === target.id) {
      done += 1;
      perform(t);
      star(shell.fx);
      play('point');
      shell.setProgress(done / TARGET);
      if (!shell.isWon()) shell.later(next, 800);
    } else {
      // no penalty — just nudge toward the glowing one
      play('select');
      shell.setHint(`Almost! Tap the glowing “${target.name}”.`);
    }
  }

  function star(layer) {
    const s = document.createElement('span');
    s.className = 'ac-mini-heart';
    s.textContent = '⭐';
    s.style.left = 40 + Math.random() * 20 + '%';
    layer.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }

  next();

  return () => {
    Object.values(btns).forEach((b) => b.replaceWith(b.cloneNode(true)));
    shell.cleanup();
  };
}
