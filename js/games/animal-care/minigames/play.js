// Play: bop the bouncing ball back to the pet. Each tap sends it flying and the
// pet hops with joy — the Happy meter fills over a short rally.

import { createShell } from './shell.js';

export function mountPlay(host, ctx) {
  const shell = createShell(host, {
    title: `Play with ${ctx.pet.name}`, icon: '🎾', color: '#ffd166', meterIcon: '❤️',
    pet: ctx.pet, petId: ctx.pet.id, winPraise: 'Wheee!', level: ctx.level,
    onWin: ctx.onWin, onBack: ctx.onBack, onReward: ctx.onReward,
  });
  shell.setHint('Tap the ball to play!');

  // Higher levels = a longer rally, and a smaller, zippier ball at the top level.
  const lvl = ctx.level || 1;
  const TARGET = 4 + lvl * 2;
  let hits = 0;
  const ball = document.createElement('button');
  ball.className = 'ac-ball' + (lvl >= 3 ? ' ac-ball-small' : '');
  ball.textContent = '🎾';
  shell.stage.appendChild(ball);

  function moveBall() {
    ball.style.left = (18 + Math.random() * 64) + '%';
    ball.style.top = (20 + Math.random() * 45) + '%';
  }
  moveBall();

  function onHit() {
    if (shell.isWon()) return;
    hits += 1;
    shell.petEl.classList.remove('mg-hop');
    void shell.petEl.offsetWidth;
    shell.petEl.classList.add('mg-hop');
    star(shell.fx);
    shell.setProgress(hits / TARGET);
    if (!shell.isWon()) moveBall();
  }
  ball.addEventListener('click', onHit);

  function star(layer) {
    const s = document.createElement('span');
    s.className = 'ac-mini-heart';
    s.textContent = '⭐';
    s.style.left = 40 + Math.random() * 20 + '%';
    layer.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }

  return () => { ball.removeEventListener('click', onHit); shell.cleanup(); };
}
