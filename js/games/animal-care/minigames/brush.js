// Brush: stroke (drag) over the messy tufts to smooth them out. The Tidy meter
// fills as each knot is brushed away.

import { createShell, onDrag, spot, dist } from './shell.js';

export function mountBrush(host, ctx) {
  const shell = createShell(host, {
    title: `Brush ${ctx.pet.name}`, icon: '🪮', color: '#c9b6ff', meterIcon: '✨',
    pet: ctx.pet, petId: ctx.pet.id, winPraise: 'So fluffy!',
    onWin: ctx.onWin, onBack: ctx.onBack, onReward: ctx.onReward,
  });
  shell.setHint('Brush out the tangles!');

  const N = 6;
  const tufts = [];
  for (let i = 0; i < N; i++) {
    const s = spot('ac-tuft', 0.24 + Math.random() * 0.52, 0.30 + Math.random() * 0.45);
    shell.fx.appendChild(s.el);
    tufts.push(s);
  }

  const stopDrag = onDrag(shell.stage, (x, y, ph) => {
    if (ph === 'up') return;
    for (const t of tufts) {
      if (!t.done && dist(x, y, t.x, t.y) < 0.11) {
        t.done = true;
        t.el.classList.add('gone');
        // a little sparkle where the knot was
        const sp = spot('ac-shine-spark', t.x, t.y);
        shell.fx.appendChild(sp.el);
        setTimeout(() => sp.el.remove(), 700);
        shell.setProgress(tufts.filter((q) => q.done).length / N);
      }
    }
  });

  return () => { stopDrag(); shell.cleanup(); };
}
