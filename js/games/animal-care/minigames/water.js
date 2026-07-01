// Water: hold anywhere to pour water into the bowl. When it's full the pet has
// a good drink — the Water meter fills as the bowl fills.

import { createShell, onDrag } from './shell.js';

export function mountWater(host, ctx) {
  const shell = createShell(host, {
    title: `Water ${ctx.pet.name}`, icon: '💧', color: '#5ec8ff', meterIcon: '💧',
    pet: ctx.pet, petId: ctx.pet.id, winPraise: 'Slurp! All better!',
    onWin: ctx.onWin, onBack: ctx.onBack,
  });
  shell.setHint('Hold to pour the water!');

  // bowl + stream
  const bowl = document.createElement('div');
  bowl.className = 'ac-bowl';
  bowl.innerHTML = '<span class="ac-bowl-water"></span>';
  shell.stage.appendChild(bowl);
  const bowlWater = bowl.querySelector('.ac-bowl-water');
  const stream = document.createElement('span');
  stream.className = 'ac-stream';
  shell.stage.appendChild(stream);

  let level = 0;
  let holding = false;
  let raf = 0;
  let alive = true;

  const stopDrag = onDrag(shell.stage, (x, y, ph) => {
    if (ph === 'down' || ph === 'move') {
      holding = true;
      stream.style.left = (x * 100) + '%';
      stream.classList.add('show');
    }
    if (ph === 'up') { holding = false; stream.classList.remove('show'); }
  });

  let last = performance.now();
  function tick(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (holding && level < 1) {
      level = Math.min(1, level + dt * 0.5);
      bowlWater.style.height = (level * 100) + '%';
      shell.setProgress(level);
      if (level >= 1) shell.petEl.classList.add('mg-drink');
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return () => { alive = false; cancelAnimationFrame(raf); stopDrag(); shell.cleanup(); };
}
