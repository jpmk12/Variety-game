// Night: the room dims and the pet gets sleepy. Gently pat it (tap) to soothe
// it — Zzz drift up and the Rest meter fills until it drifts off to sleep.

import { createShell } from './shell.js';

export function mountNight(host, ctx) {
  const shell = createShell(host, {
    title: `${ctx.pet.name}'s Bedtime`, icon: '🌙', color: '#8a8de0', meterIcon: '🌙',
    pet: ctx.pet, petId: ctx.pet.id, winPraise: 'All rested! 😴',
    onWin: ctx.onWin, onBack: ctx.onBack,
  });
  shell.el.classList.add('is-night');
  shell.setHint('Pat gently to help them sleep');

  const TARGET = 8;
  let pats = 0;

  function onPat() {
    if (shell.isWon()) return;
    pats += 1;
    shell.petEl.classList.remove('mg-pat');
    void shell.petEl.offsetWidth;
    shell.petEl.classList.add('mg-pat');
    zzz(shell.fx);
    if (pats >= TARGET - 1) shell.petEl.classList.add('mg-asleep');
    shell.setProgress(pats / TARGET);
  }
  shell.petEl.addEventListener('click', onPat);

  function zzz(layer) {
    const z = document.createElement('span');
    z.className = 'ac-mini-heart ac-zzz';
    z.textContent = '💤';
    z.style.left = 46 + Math.random() * 14 + '%';
    layer.appendChild(z);
    setTimeout(() => z.remove(), 1100);
  }

  return () => { shell.petEl.removeEventListener('click', onPat); shell.cleanup(); };
}
