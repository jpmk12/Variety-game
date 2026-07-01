// Feed: drag each treat up to the pet's mouth. Every bite fills the Food meter.

import { createShell, dragItem, dist } from './shell.js';

const TREATS = ['🍖', '🦴', '🍗', '🥩', '🍪'];
const MOUTH = { x: 0.5, y: 0.5, r: 0.2 }; // stage-fraction mouth zone

export function mountFeed(host, ctx) {
  const shell = createShell(host, {
    title: `Feed ${ctx.pet.name}`, icon: '🍖', color: '#ff9f68', meterIcon: '🍖',
    pet: ctx.pet, petId: ctx.pet.id, winPraise: 'Yum yum!',
    onWin: ctx.onWin, onBack: ctx.onBack,
  });
  shell.setHint('Drag the food to the mouth!');

  const N = TREATS.length;
  let fed = 0;
  const cleanups = [];

  TREATS.forEach((glyph, i) => {
    const el = document.createElement('button');
    el.className = 'ac-treat';
    el.textContent = glyph;
    el.style.left = (12 + i * 19) + '%';
    shell.stage.appendChild(el);
    cleanups.push(dragItem(el, shell.stage, (x, y) => {
      if (dist(x, y, MOUTH.x, MOUTH.y) < MOUTH.r) {
        fed += 1;
        shell.petEl.classList.remove('mg-chew');
        void shell.petEl.offsetWidth;
        shell.petEl.classList.add('mg-chew');
        heart(shell.fx);
        shell.setProgress(fed / N);
        return true; // eaten
      }
      return false; // springs back
    }));
  });

  function heart(layer) {
    const h = document.createElement('span');
    h.className = 'ac-mini-heart';
    h.textContent = '❤️';
    h.style.left = 40 + Math.random() * 20 + '%';
    layer.appendChild(h);
    setTimeout(() => h.remove(), 1000);
  }

  return () => { cleanups.forEach((c) => c()); shell.cleanup(); };
}
