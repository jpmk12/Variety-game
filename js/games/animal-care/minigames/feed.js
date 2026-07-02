// Feed: drag each treat up to the pet's mouth. Every bite fills the Food meter.
// At higher levels a few "yucky" foods sneak in — the pet shakes its head and
// refuses them, so the child has to pick the good treats.

import { createShell, dragItem, dist } from './shell.js';

const TREATS = ['🍖', '🦴', '🍗', '🥩', '🍪']; // 5 good treats to eat
const YUCKY = ['🥦', '🧅', '🌶️', '🍋']; // pets say "no thanks!" to these
const MOUTH = { x: 0.5, y: 0.5, r: 0.2 }; // stage-fraction mouth zone

export function mountFeed(host, ctx) {
  const shell = createShell(host, {
    title: `Feed ${ctx.pet.name}`, icon: '🍖', color: '#ff9f68', meterIcon: '🍖',
    pet: ctx.pet, petId: ctx.pet.id, winPraise: 'Yum yum!', level: ctx.level,
    onWin: ctx.onWin, onBack: ctx.onBack, onReward: ctx.onReward,
  });

  const lvl = ctx.level || 1;
  const wrongCount = Math.min(YUCKY.length, lvl - 1); // 0 / 1 / 2 yucky foods
  shell.setHint(wrongCount ? 'Feed the yummy food — skip the yucky!' : 'Drag the food to the mouth!');

  const N = TREATS.length; // still need to feed all 5 good treats to win
  let fed = 0;
  const cleanups = [];

  // Build the tray: the good treats plus any yucky distractors, shuffled and
  // spread evenly so wrong foods aren't always in the same spot.
  const items = [
    ...TREATS.map((glyph) => ({ glyph, good: true })),
    ...YUCKY.slice(0, wrongCount).map((glyph) => ({ glyph, good: false })),
  ];
  shuffle(items);

  items.forEach((item, i) => {
    const el = document.createElement('button');
    el.className = 'ac-treat' + (item.good ? '' : ' is-yucky');
    el.textContent = item.glyph;
    el.style.left = (8 + i * (76 / Math.max(1, items.length - 1))) + '%';
    shell.stage.appendChild(el);
    cleanups.push(dragItem(el, shell.stage, (x, y) => {
      if (dist(x, y, MOUTH.x, MOUTH.y) >= MOUTH.r) return false; // springs back
      if (item.good) {
        fed += 1;
        chew('mg-chew', '❤️');
        shell.setProgress(fed / N);
        return true; // eaten
      }
      // yucky: the pet refuses with a head shake — no penalty, food springs back
      chew('mg-refuse', '🙅');
      shell.setHint('Yuck! Try a yummy treat.');
      return false;
    }));
  });

  function chew(pose, glyph) {
    shell.petEl.classList.remove('mg-chew', 'mg-refuse');
    void shell.petEl.offsetWidth;
    shell.petEl.classList.add(pose);
    const h = document.createElement('span');
    h.className = 'ac-mini-heart';
    h.textContent = glyph;
    h.style.left = 40 + Math.random() * 20 + '%';
    shell.fx.appendChild(h);
    setTimeout(() => h.remove(), 1000);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  return () => { cleanups.forEach((c) => c()); shell.cleanup(); };
}
