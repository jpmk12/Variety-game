// Bath: scrub the dirt off (each dirty spot rubbed away leaves suds), then
// rinse the suds away. The Clean meter fills across both phases.

import { createShell, onDrag, spot, dist, reduceMotion } from './shell.js';

export function mountBath(host, ctx) {
  const shell = createShell(host, {
    title: `${ctx.pet.name}'s Bath`, icon: '🛁', color: '#9be7c4', meterIcon: '🫧',
    pet: ctx.pet, petId: ctx.pet.id, winPraise: 'Squeaky clean!', level: ctx.level,
    onWin: ctx.onWin, onBack: ctx.onBack, onReward: ctx.onReward,
  });
  shell.setHint('Scrub off the dirt!');

  // Higher levels = more dirt to scrub + rinse.
  const N = 5 + (ctx.level || 1) * 2;
  const dirt = [];
  const suds = [];
  let phase = 'scrub';

  for (let i = 0; i < N; i++) {
    const s = spot('ac-dirt', 0.26 + Math.random() * 0.48, 0.40 + Math.random() * 0.40);
    shell.fx.appendChild(s.el);
    dirt.push(s);
  }

  function refresh() {
    if (phase === 'scrub') {
      const done = dirt.filter((d) => d.done).length;
      shell.setProgress(done / N * 0.5);
      if (done >= N) { phase = 'rinse'; shell.setHint('Now rinse the bubbles!'); }
    } else {
      const done = suds.filter((s) => s.done).length;
      shell.setProgress(0.5 + done / N * 0.5);
    }
  }

  const stopDrag = onDrag(shell.stage, (x, y, ph) => {
    if (ph === 'up') return;
    const arr = phase === 'scrub' ? dirt : suds;
    for (const t of arr) {
      if (!t.done && dist(x, y, t.x, t.y) < 0.1) {
        t.done = true;
        t.el.classList.add('gone');
        if (phase === 'scrub') {
          const su = spot('ac-sud', t.x, t.y);
          shell.fx.appendChild(su.el);
          suds.push(su);
        }
        refresh();
      }
    }
  });

  return () => { stopDrag(); shell.cleanup(); };
}
