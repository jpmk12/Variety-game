// The "welcome back" popup shown on the hub once per app load when today's daily
// treat hasn't been claimed. Shows the streak flame, a 7-day calendar row, and a
// Claim button that pays the stars out into the wallet.

import { status, claim, CYCLE } from './daily.js';
import { play } from './audio.js';

const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Renders the overlay into `container`. `onDone` runs after it closes (claimed
// or dismissed) so the hub can refresh its star count.
export function renderDailyModal(container, onDone) {
  const st = status();

  const overlay = document.createElement('div');
  overlay.className = 'daily-modal';
  const days = Array.from({ length: CYCLE }, (_, i) => {
    const n = i + 1;
    const done = n < st.cycleDay;
    const today = n === st.cycleDay;
    // The last day of the week is a treasure chest — a visible pay-off for
    // keeping the streak all the way to day 7.
    const label = done ? '⭐' : (n === CYCLE ? '🎁' : n);
    return `<span class="daily-day${done ? ' is-done' : ''}${today ? ' is-today' : ''}${n === CYCLE ? ' is-chest' : ''}">${label}</span>`;
  }).join('');
  const weekNote = st.weekBonus ? `<p class="daily-bonus">🎁 Week complete — +${st.weekBonus} bonus stars!</p>` : '';

  overlay.innerHTML = `
    <div class="daily-card">
      <button class="daily-close" aria-label="Close">✕</button>
      <div class="daily-flame" aria-hidden="true">🔥</div>
      <h2 class="daily-title">Welcome back!</h2>
      <p class="daily-streak">${st.streak}-day streak</p>
      <div class="daily-cycle" aria-label="Daily streak calendar">${days}</div>
      ${weekNote}
      <button class="daily-claim">Claim ⭐ ${st.reward}</button>
    </div>
  `;

  function close() {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, reduceMotion ? 0 : 200);
  }

  overlay.querySelector('.daily-close').addEventListener('click', () => { play('select'); close(); });

  overlay.querySelector('.daily-claim').addEventListener('click', function claimNow() {
    const res = claim();
    play('happy');
    // A little burst of stars flying up from the button.
    if (!reduceMotion) burst(overlay.querySelector('.daily-card'));
    const btn = overlay.querySelector('.daily-claim');
    btn.textContent = `+${res.reward} ⭐ Yay!`;
    btn.disabled = true;
    overlay.querySelector('.daily-flame').classList.add('daily-flame-pop');
    setTimeout(close, reduceMotion ? 0 : 900);
  });

  function burst(card) {
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('span');
      s.className = 'daily-star';
      s.textContent = '⭐';
      s.style.left = 50 + (Math.random() * 40 - 20) + '%';
      s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
      s.style.animationDelay = Math.random() * 0.2 + 's';
      card.appendChild(s);
      setTimeout(() => s.remove(), 1100);
    }
  }

  container.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}
