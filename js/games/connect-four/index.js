// Connect Four — drop pet tokens into a 7×6 rack and get four in a row (across,
// up, or diagonally). Tap a column and your token tumbles to the bottom. Pet-
// themed (🐶 Puppy vs 🐱 Kitty), two-player or against a gentle computer. Like
// the rest of the hub there's no scary "game over": a win is confetti, a full
// board is a friendly tie, and "play again" is always one tap away.

import { play, isMuted, unlock } from '../../audio.js';
import { speak, cancelSpeech } from '../samurai/speech.js';
import { load, save } from '../../storage.js';
import { award } from '../../progress.js';

const SAVE_KEY = 'connect-four';
const COLS = 7;
const ROWS = 6;
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

const PLAYERS = [
  { id: 'dog', name: 'Puppy', emoji: '🐶', color: '#ffb703' },
  { id: 'cat', name: 'Kitty', emoji: '🐱', color: '#4cc9f0' },
];

// grid is an array of COLS stacks; grid[c][r] is the token at column c, row r
// counting r=0 at the BOTTOM. A move fills the lowest empty row of a column.
function emptyGrid() { return Array.from({ length: COLS }, () => []); }
function heightOf(grid, c) { return grid[c].length; }
function at(grid, c, r) {
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
  return grid[c][r] || null;
}

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];   // →, ↑, ↗, ↘
// Starting from a just-placed token at (c,r), return the four+ cells that form a
// line, or null. Used both to detect a win and to highlight the winning tokens.
function winningCells(grid, c, r, p) {
  for (const [dc, dr] of DIRS) {
    const cells = [[c, r]];
    for (const s of [1, -1]) {
      let cc = c + dc * s, rr = r + dr * s;
      while (at(grid, cc, rr) === p) { cells.push([cc, rr]); cc += dc * s; rr += dr * s; }
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

// Would dropping player p into column c win outright? (used by the AI)
function dropWins(grid, c, p) {
  if (heightOf(grid, c) >= ROWS) return false;
  const r = heightOf(grid, c);
  grid[c].push(p);
  const win = !!winningCells(grid, c, r, p);
  grid[c].pop();
  return win;
}

// Easy, kid-beatable computer: win if it can, block most of the time, otherwise
// lean toward the middle where more lines cross.
function aiColumn(grid, me, opp) {
  const valid = [];
  for (let c = 0; c < COLS; c++) if (heightOf(grid, c) < ROWS) valid.push(c);
  if (!valid.length) return null;
  for (const c of valid) if (dropWins(grid, c, me)) return c;
  if (Math.random() < 0.7) {
    for (const c of valid) if (dropWins(grid, c, opp)) return c;
  }
  // Weight columns by closeness to center (3), plus a little randomness.
  const weight = (c) => (4 - Math.abs(c - 3)) + Math.random() * 2;
  return valid.slice().sort((a, b) => weight(b) - weight(a))[0];
}

export function mountConnectFour(root) {
  const game = document.createElement('div');
  game.className = 'c4-game';
  game.innerHTML = `
    <div class="c4-stage">
      <div class="c4-turn" role="status" aria-live="polite">
        <span class="c4-turn-face" aria-hidden="true"></span>
        <span class="c4-turn-text"></span>
      </div>
      <div class="c4-board" role="group" aria-label="Connect Four board"></div>
      <div class="c4-banner" role="status"></div>
      <button class="c4-again" hidden>Play again ↻</button>
    </div>
    <div class="c4-start">
      <div class="c4-start-card">
        <div class="c4-start-emoji" aria-hidden="true">🔴🟡</div>
        <h2>Connect Four</h2>
        <p>Drop your pet — get four in a row!</p>
        <div class="c4-modes" role="group" aria-label="Choose players">
          <button class="c4-mode" data-mode="2p">👦👧 2 Players</button>
          <button class="c4-mode" data-mode="ai">👦🤖 vs Computer</button>
        </div>
      </div>
    </div>
  `;
  root.appendChild(game);

  const turnFace = game.querySelector('.c4-turn-face');
  const turnText = game.querySelector('.c4-turn-text');
  const boardEl = game.querySelector('.c4-board');
  const banner = game.querySelector('.c4-banner');
  const againBtn = game.querySelector('.c4-again');
  const startOverlay = game.querySelector('.c4-start');

  // --- state ---
  const saved = load(SAVE_KEY, {}) || {};
  let mode = saved.mode === 'ai' ? 'ai' : '2p';
  let grid = emptyGrid();
  let turn = 0;
  let over = false;
  let busy = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

  // test hook
  game.__c4 = {
    get grid() { return grid.map((col) => [...col]); },
    get turn() { return PLAYERS[turn].id; },
    get mode() { return mode; },
    get over() { return over; },
    drop: (c) => tapColumn(c),
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
    grid = emptyGrid();
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
    turnText.textContent = (mode === 'ai' && turn === 1) ? 'Computer is thinking…' : `${p.name}'s turn`;
  }

  // The board is seven tap-able columns; each holds six stacked cells rendered
  // top (r=5) down to bottom (r=0) so gravity reads correctly on screen.
  function renderBoard() {
    boardEl.innerHTML = '';
    for (let c = 0; c < COLS; c++) {
      const col = document.createElement('button');
      col.className = 'c4-col';
      col.dataset.c = c;
      col.setAttribute('aria-label', `Drop in column ${c + 1}`);
      for (let r = ROWS - 1; r >= 0; r--) {
        const cell = document.createElement('span');
        cell.className = 'c4-cell';
        cell.dataset.c = c;
        cell.dataset.r = r;
        col.appendChild(cell);
      }
      col.addEventListener('click', () => tapColumn(c));
      boardEl.appendChild(col);
    }
  }

  function cellEl(c, r) { return boardEl.querySelector(`.c4-cell[data-c="${c}"][data-r="${r}"]`); }

  function tapColumn(c) {
    if (over || busy) return;
    if (heightOf(grid, c) >= ROWS) { play('oops'); return; }   // column full
    const who = PLAYERS[turn].id;
    drop(c, who);
    if (over) return;
    turn = 1 - turn;
    renderTurn();
    if (mode === 'ai' && turn === 1) {
      busy = true;
      setColsEnabled(false);
      later(() => {
        const c2 = aiColumn(grid, 'cat', 'dog');
        busy = false;
        if (c2 != null && !over) {
          drop(c2, 'cat');
          if (!over) { turn = 0; renderTurn(); setColsEnabled(true); }
        }
      }, reduceMotion ? 220 : 700);
    }
  }

  function drop(c, who) {
    const r = heightOf(grid, c);
    grid[c].push(who);
    const p = PLAYERS.find((x) => x.id === who);
    const cell = cellEl(c, r);
    if (cell) {
      cell.classList.add('is-filled');
      cell.style.setProperty('--pc', p.color);
      cell.innerHTML = `<span class="c4-token" aria-hidden="true">${p.emoji}</span>`;
      if (!reduceMotion) {
        // fall from the top of the rack for a satisfying plop
        const drops = (ROWS - r);
        cell.querySelector('.c4-token').style.setProperty('--drop', `${-drops * 15}vh`);
        cell.querySelector('.c4-token').classList.add('c4-fall');
      }
    }
    play('drop');

    const win = winningCells(grid, c, r, who);
    if (win) return finish(who, win);
    if (grid.every((col) => col.length >= ROWS)) return finish(null, null);
  }

  function setColsEnabled(on) {
    boardEl.querySelectorAll('.c4-col').forEach((b) => { b.disabled = !on; });
  }

  function finish(winner, cells) {
    over = true;
    setColsEnabled(false);
    if (cells) cells.forEach(([c, r]) => { const el = cellEl(c, r); if (el) el.classList.add('c4-win-cell'); });

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
      const stickers = ['c4-first', 'c4-win'];
      if (beatComputer) stickers.push('c4-ai');
      award({ stars: 3, counter: 'c4Games', stickers });
    } else {
      turnText.textContent = "It's a tie! 🤝";
      play('point');
      showBanner('Good game! 🤝', true);
      if (!isMuted()) speak("It's a tie! Good game!");
      award({ stars: 2, counter: 'c4Games', stickers: ['c4-first'] });
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
      c.className = 'c4-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      game.querySelector('.c4-stage').appendChild(c);
      later(() => c.remove(), 2400);
    }
  }

  game.querySelectorAll('.c4-mode').forEach((b) => {
    b.addEventListener('click', () => { mode = b.dataset.mode === 'ai' ? 'ai' : '2p'; start(); });
  });
  againBtn.addEventListener('click', () => { play('select'); newRound(); });

  return function unmount() {
    cancelSpeech();
    timers.forEach(clearTimeout);
    game.remove();
  };
}
