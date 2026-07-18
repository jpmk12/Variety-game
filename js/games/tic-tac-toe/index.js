// Tic-Tac-Toe — the classic 3-in-a-row, pet-themed. Two players take turns
// placing their pet (🐶 Puppy vs 🐱 Kitty) on a 3×3 board; three in a row wins.
// Play head-to-head (two kids) or against a gentle, beatable computer. There is
// no harsh "game over" — a win is a celebration, a tie is a happy "good game",
// and a new round is always one tap away.

import { play, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from '../samurai/speech.js';
import { load, save } from '../../storage.js';
import { award } from '../../progress.js';

const SAVE_KEY = 'tic-tac-toe';
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The two contestants. The big pet face + its color carry the meaning; the name
// is for the grown-up reading over a shoulder.
const PLAYERS = [
  { id: 'dog', name: 'Puppy', emoji: '🐶', color: '#ffb703' },
  { id: 'cat', name: 'Kitty', emoji: '🐱', color: '#4cc9f0' },
];

// The eight ways to make a line on a 3×3 board (indices 0..8, row-major).
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// If player p has two in a line with the third empty, return that empty cell.
function findWinningCell(board, p) {
  for (const line of LINES) {
    const marks = line.map((i) => board[i]);
    if (marks.filter((m) => m === p).length === 2 && marks.includes(null)) {
      return line[marks.indexOf(null)];
    }
  }
  return null;
}

// A deliberately easy opponent: it takes a win when it sees one and blocks
// *most* of the time, so a five-year-old can still sneak a victory through.
function aiMove(board, me, opp) {
  const win = findWinningCell(board, me);
  if (win != null) return win;
  const block = findWinningCell(board, opp);
  if (block != null && Math.random() < 0.65) return block;
  const empty = board.map((v, i) => (v ? null : i)).filter((i) => i != null);
  if (board[4] == null && Math.random() < 0.6) return 4;   // center is nice
  return empty[Math.floor(Math.random() * empty.length)];
}

export function mountTicTacToe(root) {
  const game = document.createElement('div');
  game.className = 'ttt-game';
  game.innerHTML = `
    <div class="ttt-stage">
      <div class="ttt-turn" role="status" aria-live="polite">
        <span class="ttt-turn-face" aria-hidden="true"></span>
        <span class="ttt-turn-text"></span>
      </div>
      <div class="ttt-board" role="group" aria-label="Tic-Tac-Toe board"></div>
      <div class="ttt-banner" role="status"></div>
      <button class="ttt-again" hidden>Play again ↻</button>
    </div>
    <div class="ttt-start">
      <div class="ttt-start-card">
        <div class="ttt-start-emoji" aria-hidden="true">🐶✖️🐱</div>
        <h2>Tic-Tac-Toe</h2>
        <p>Get three in a row!</p>
        <div class="ttt-modes" role="group" aria-label="Choose players">
          <button class="ttt-mode" data-mode="2p">👦👧 2 Players</button>
          <button class="ttt-mode" data-mode="ai">👦🤖 vs Computer</button>
        </div>
      </div>
    </div>
  `;
  root.appendChild(game);

  const turnFace = game.querySelector('.ttt-turn-face');
  const turnText = game.querySelector('.ttt-turn-text');
  const boardEl = game.querySelector('.ttt-board');
  const banner = game.querySelector('.ttt-banner');
  const againBtn = game.querySelector('.ttt-again');
  const startOverlay = game.querySelector('.ttt-start');

  // --- state ---
  const saved = load(SAVE_KEY, {}) || {};
  let mode = saved.mode === 'ai' ? 'ai' : '2p';     // '2p' | 'ai'
  let board = Array(9).fill(null);                  // each cell: null | 'dog' | 'cat'
  let turn = 0;                                     // index into PLAYERS
  let over = false;
  let busy = false;                                 // true while the AI is "thinking"
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

  const humanIsCat = () => mode === 'ai';   // in AI mode the computer plays the cat (index 1)

  // test hook
  game.__ttt = {
    get board() { return [...board]; },
    get turn() { return PLAYERS[turn].id; },
    get mode() { return mode; },
    get over() { return over; },
    place: (i) => tap(i),
    reset: () => newRound(),
    setMode: (m) => { mode = m === 'ai' ? 'ai' : '2p'; start(); },
  };

  function start() {
    unlock();
    save(SAVE_KEY, { mode });
    startOverlay.classList.add('hidden');
    newRound();
  }

  function newRound() {
    board = Array(9).fill(null);
    turn = 0;
    over = false;
    busy = false;
    againBtn.hidden = true;
    banner.classList.remove('show');
    renderBoard();
    renderTurn();
  }

  function renderTurn() {
    const p = PLAYERS[turn];
    turnFace.textContent = p.emoji;
    turnFace.style.setProperty('--pc', p.color);
    if (over) return;
    const you = mode === 'ai' && turn === 1;
    turnText.textContent = you ? 'Computer is thinking…' : `${p.name}'s turn`;
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    board.forEach((cell, i) => {
      const btn = document.createElement('button');
      btn.className = 'ttt-cell';
      btn.dataset.i = i;
      if (cell) {
        const p = PLAYERS.find((x) => x.id === cell);
        btn.classList.add('is-filled');
        btn.style.setProperty('--pc', p.color);
        btn.innerHTML = `<span class="ttt-mark" aria-hidden="true">${p.emoji}</span>`;
        btn.setAttribute('aria-label', `${p.name} here`);
        btn.disabled = true;
      } else {
        btn.setAttribute('aria-label', `Empty square ${i + 1}`);
        btn.addEventListener('click', () => tap(i));
      }
      boardEl.appendChild(btn);
    });
  }

  function tap(i) {
    if (over || busy || board[i]) return;
    place(i, PLAYERS[turn].id);
    if (over) return;
    turn = 1 - turn;
    renderTurn();
    // Hand off to the computer if it's the cat's turn in AI mode.
    if (mode === 'ai' && turn === 1) {
      busy = true;
      setBoardEnabled(false);
      later(() => {
        const i2 = aiMove(board, 'cat', 'dog');
        busy = false;
        if (i2 != null && !over) {
          place(i2, 'cat');
          if (!over) { turn = 0; renderTurn(); setBoardEnabled(true); }
        }
      }, reduceMotion ? 200 : 620);
    }
  }

  function place(i, who) {
    board[i] = who;
    const btn = boardEl.querySelector(`.ttt-cell[data-i="${i}"]`);
    const p = PLAYERS.find((x) => x.id === who);
    if (btn) {
      btn.classList.add('is-filled', 'ttt-pop');
      btn.style.setProperty('--pc', p.color);
      btn.innerHTML = `<span class="ttt-mark" aria-hidden="true">${p.emoji}</span>`;
      btn.disabled = true;
      btn.replaceWith(btn.cloneNode(true));   // drop the click listener
    }
    play('select');

    const winLine = LINES.find((l) => l.every((c) => board[c] === who));
    if (winLine) return finish(who, winLine);
    if (board.every((c) => c)) return finish(null, null);   // full board → tie
  }

  function setBoardEnabled(on) {
    boardEl.querySelectorAll('.ttt-cell:not(.is-filled)').forEach((b) => { b.disabled = !on; });
  }

  function finish(winner, line) {
    over = true;
    setBoardEnabled(false);
    if (line) {
      line.forEach((c) => {
        const b = boardEl.querySelector(`.ttt-cell[data-i="${c}"]`);
        if (b) b.classList.add('ttt-win-cell');
      });
    }

    if (winner) {
      const p = PLAYERS.find((x) => x.id === winner);
      const beatComputer = mode === 'ai' && winner === 'dog';
      turnFace.textContent = p.emoji;
      turnFace.style.setProperty('--pc', p.color);
      turnText.textContent = `${p.name} wins! 🎉`;
      confetti(p.color);
      play('happy');
      showBanner(`${p.emoji} ${p.name} wins!`, true);
      if (!isMuted()) speak(mode === 'ai' && winner === 'cat' ? 'The computer wins! Play again?' : `${p.name} wins!`);
      const stickers = ['ttt-first', 'ttt-win'];
      if (beatComputer) stickers.push('ttt-ai');
      award({ stars: 3, counter: 'tttGames', stickers });
    } else {
      turnText.textContent = "It's a tie! 🤝";
      play('point');
      showBanner('Good game! 🤝', true);
      if (!isMuted()) speak("It's a tie! Good game!");
      award({ stars: 2, counter: 'tttGames', stickers: ['ttt-first'] });
    }
    againBtn.hidden = false;
  }

  function showBanner(msg, good) {
    banner.textContent = msg;
    banner.classList.toggle('is-good', !!good);
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
  }

  const CONFETTI = ['#ff6b9d', '#ffd166', '#2ec4b6', '#5ec8ff', '#bdb2ff', '#ff8c42'];
  function confetti(accent) {
    const n = reduceMotion ? 10 : 28;
    const colors = accent ? [accent, ...CONFETTI] : CONFETTI;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'ttt-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      game.querySelector('.ttt-stage').appendChild(c);
      later(() => c.remove(), 2400);
    }
  }

  game.querySelectorAll('.ttt-mode').forEach((b) => {
    b.addEventListener('click', () => { mode = b.dataset.mode === 'ai' ? 'ai' : '2p'; start(); });
  });
  againBtn.addEventListener('click', () => { play('select'); newRound(); });

  return function unmount() {
    cancelSpeech();
    timers.forEach(clearTimeout);
    game.remove();
  };
}
