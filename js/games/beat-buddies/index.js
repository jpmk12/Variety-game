// Beat Buddies — a gentle rhythm game. The three pets are a band, one per lane.
// Beat bubbles float down each lane toward a hit ring at the pet; tap the pet as
// its bubble lands and it plays its instrument. Fill the meter to finish the
// song. Forgiving windows, no fail state — missed bubbles just drift away, and
// tapping a pet always plays a note (so it doubles as a toy).

import { ANIMALS } from '../animal-care/animals.js';
import { play, playVoice, isMuted, unlock } from '../../audio.js';
import { load, save } from '../../storage.js';
import { cancelSpeech } from '../samurai/speech.js';
import { award } from '../../progress.js';
import { LANES, INSTRUMENTS, SONGS, songNotes, songDifficulty, playInstrument } from './songs.js';

const SAVE_KEY = 'beat-buddies';

const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

const TRAVEL = 1.9;   // seconds a bubble takes to reach the hit ring
const HIT_Y = 82;     // hit ring position, % down the lane
const WINDOW = 0.32;  // ± seconds around a bubble's arrival that counts as a hit

export function mountBeatBuddies(root) {
  const petSvg = (id) => (ANIMALS.find((a) => a.id === id) || {}).svg || '';

  const game = document.createElement('div');
  game.className = 'bb-game';
  game.innerHTML = `
    <div class="bb-stage">
      <div class="bb-topbar">
        <div class="bb-meter" aria-label="Song progress"><span class="bb-meter-fill"></span></div>
        <span class="bb-combo" aria-hidden="true"></span>
      </div>
      <div class="bb-lanes">
        ${LANES.map((id, i) => `
          <div class="bb-lane" data-lane="${i}" style="--lane:${INSTRUMENTS[id].color}">
            <div class="bb-track"></div>
            <div class="bb-hit" aria-hidden="true"></div>
            <button class="bb-pet" data-lane="${i}" aria-label="${id} plays ${INSTRUMENTS[id].label}">
              <span class="bb-inst" aria-hidden="true">${INSTRUMENTS[id].emoji}</span>
              <span class="bb-art">${petSvg(id)}</span>
            </button>
          </div>`).join('')}
      </div>
      <div class="bb-count" aria-hidden="true"></div>
      <div class="bb-banner" role="status"></div>
    </div>
    <div class="bb-start">
      <div class="bb-start-card">
        <div class="bb-start-emoji" aria-hidden="true">🎵</div>
        <h2>Beat Buddies</h2>
        <p class="bb-start-msg">Tap each animal to the beat!</p>
        <div class="bb-songs"></div>
      </div>
    </div>
  `;
  root.appendChild(game);

  const stage = game.querySelector('.bb-stage');
  const laneEls = [...game.querySelectorAll('.bb-lane')];
  const trackEls = laneEls.map((l) => l.querySelector('.bb-track'));
  const petEls = laneEls.map((l) => l.querySelector('.bb-pet'));
  const meterFill = game.querySelector('.bb-meter-fill');
  const comboEl = game.querySelector('.bb-combo');
  const countEl = game.querySelector('.bb-count');
  const banner = game.querySelector('.bb-banner');
  const startOverlay = game.querySelector('.bb-start');
  const startMsg = game.querySelector('.bb-start-msg');
  const songsEl = game.querySelector('.bb-songs');

  // --- state ---
  let notes = [];
  let bubbles = [];      // { lane, arrival, el, hit, missed }
  let spawnIdx = 0;
  let songTime = 0;
  let songEnd = 0;
  let hits = 0, total = 0, combo = 0;
  let mode = 'idle';     // 'idle' | 'count' | 'play' | 'done'
  let freeJam = false;
  let auto = false;      // test hook: auto-hit bubbles perfectly
  let curSong = null;    // the song being played (for the win summary + best)
  let curBpm = 0;        // current song tempo (for the beat bob)
  let beatAcc = 0;       // seconds since the last beat pulse
  const steps = [0, 0, 0];
  // Best star rating earned per song (persisted), shown on the picker.
  const best = { ...((load(SAVE_KEY, {}) || {}).best || {}) };
  const saveBest = () => save(SAVE_KEY, { best });
  let raf = 0, lastT = 0, alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };

  // test hook
  stage.__bb = {
    get progress() { return total ? hits / total : 0; },
    get won() { return mode === 'done'; },
    get mode() { return mode; },
    get bubbles() { return bubbles.filter((b) => !b.hit && !b.missed).length; },
    hitLane: (i) => hitLane(i),
    setAuto: (v) => { auto = !!v; },
    start: (songId) => startSong(SONGS.find((s) => s.id === songId) || SONGS[0]),
    startJam: () => startSong({ id: 'jam', name: 'Free Jam', freeJam: true }),
  };

  // --- song picker ---
  function buildPicker() {
    songsEl.innerHTML = '';
    SONGS.forEach((song) => {
      const diff = songDifficulty(song);
      const stars = best[song.id] || 0;
      const b = document.createElement('button');
      b.className = 'bb-song';
      b.dataset.song = song.id;
      b.innerHTML = `
        <span class="bb-song-emoji" aria-hidden="true">${song.emoji}</span>
        <span class="bb-song-name">${song.name}</span>
        <span class="bb-song-diff">${diff.emoji} ${diff.label}</span>
        <span class="bb-song-best" aria-label="${stars} of 3 stars">${'⭐'.repeat(stars)}${'·'.repeat(3 - stars)}</span>
      `;
      b.addEventListener('click', () => startSong(song));
      songsEl.appendChild(b);
    });
    const jam = document.createElement('button');
    jam.className = 'bb-song bb-song-jam';
    jam.innerHTML = `<span class="bb-song-emoji" aria-hidden="true">🎶</span><span class="bb-song-name">Free Jam</span><span class="bb-song-diff">🧸 Anytime</span>`;
    jam.addEventListener('click', () => startSong({ id: 'jam', name: 'Free Jam', freeJam: true }));
    songsEl.appendChild(jam);
  }
  buildPicker();

  // --- start a song ---
  function startSong(song) {
    unlock();
    clearTimers();
    bubbles.forEach((b) => b.el.remove());
    bubbles = [];
    notes = songNotes(song).map((n) => ({ ...n, arrival: n.time + TRAVEL }));
    total = notes.length;
    songEnd = total ? notes[notes.length - 1].arrival + 1.2 : 0;
    spawnIdx = 0; songTime = 0; hits = 0; combo = 0;
    steps[0] = steps[1] = steps[2] = 0;
    freeJam = !!song.freeJam;
    curSong = song;
    curBpm = song.bpm || 100;
    beatAcc = 0;
    setMeter(0); setCombo(0);
    banner.classList.remove('show');
    startOverlay.classList.add('hidden');

    if (freeJam) {
      // No bubbles — just an instrument playground.
      mode = 'play';
      countEl.textContent = '';
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
      return;
    }
    countIn(() => {
      mode = 'play';
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    });
  }

  // "3 · 2 · 1 · Go!" before the song, so the child can get ready.
  function countIn(done) {
    mode = 'count';
    const beats = ['3', '2', '1', 'Go!'];
    let i = 0;
    const tick = () => {
      if (!alive) return;
      countEl.textContent = beats[i];
      countEl.classList.remove('show');
      void countEl.offsetWidth;
      countEl.classList.add('show');
      if (!isMuted()) play('select');
      i += 1;
      if (i < beats.length) later(tick, 480);
      else later(() => { countEl.classList.remove('show'); countEl.textContent = ''; done(); }, 480);
    };
    tick();
  }

  // --- main loop ---
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
    lastT = now;
    if (mode === 'play') update(dt);
    raf = requestAnimationFrame(frame);
  }

  function update(dt) {
    songTime += dt;

    // gently bob the whole band on each beat so the stage feels alive
    beatAcc += dt;
    const beatDur = 60 / curBpm;
    if (beatAcc >= beatDur) { beatAcc -= beatDur; pulseBeat(); }

    // spawn notes whose bubble should now begin its descent
    while (spawnIdx < notes.length && notes[spawnIdx].arrival - TRAVEL <= songTime) {
      spawnBubble(notes[spawnIdx]);
      spawnIdx += 1;
    }

    // move / resolve bubbles; note which lanes have a bubble about to land so
    // we can nudge the pet the child should tap next.
    const nearing = new Set();
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      if (b.hit || b.missed) continue;
      const prog = (songTime - (b.arrival - TRAVEL)) / TRAVEL; // 1 = at the ring
      b.el.style.top = Math.min(prog, 1.3) * HIT_Y + '%';
      if (prog >= 0.68 && prog <= 1.08) nearing.add(b.lane);
      if (auto && Math.abs(songTime - b.arrival) <= 0.03) { resolveHit(b); continue; }
      if (songTime > b.arrival + WINDOW) { missBubble(b); }
    }
    if (!freeJam) petEls.forEach((p, i) => p.classList.toggle('bb-ready', nearing.has(i)));
    // clear away resolved bubbles that have finished their exit
    bubbles = bubbles.filter((b) => b.el.isConnected);

    if (!freeJam && mode === 'play' && spawnIdx >= notes.length
      && bubbles.every((b) => b.hit || b.missed) && songTime > songEnd) {
      win();
    }
  }

  function spawnBubble(note) {
    const el = document.createElement('span');
    el.className = 'bb-bubble';
    el.style.top = '0%';
    // Show the lane's instrument inside the bubble so a young child can see
    // which pet it belongs to — colour alone isn't enough of a cue.
    el.innerHTML = `<span class="bb-bubble-inst" aria-hidden="true">${INSTRUMENTS[LANES[note.lane]].emoji}</span>`;
    trackEls[note.lane].appendChild(el);
    bubbles.push({ lane: note.lane, arrival: note.arrival, el, hit: false, missed: false });
  }

  // --- input ---
  function hitLane(i) {
    bouncePet(i);
    playInstrumentLane(i);
    if (freeJam) return true;

    // nearest un-resolved bubble in this lane within the window
    let best = null, bestDiff = Infinity;
    for (const b of bubbles) {
      if (b.lane !== i || b.hit || b.missed) continue;
      const diff = Math.abs(songTime - b.arrival);
      if (diff < bestDiff) { bestDiff = diff; best = b; }
    }
    if (best && bestDiff <= WINDOW) { resolveHit(best, bestDiff, true); return true; }
    return false; // a "free" tap — still made a sound, just no bubble to score
  }

  function resolveHit(b, diff = 0, fromTap = false) {
    b.hit = true;
    hits += 1;
    combo += 1;
    setMeter(hits / total);
    setCombo(combo);
    if (!fromTap) { bouncePet(b.lane); playInstrumentLane(b.lane); }
    const rating = diff <= WINDOW * 0.5 ? 'Perfect!' : 'Nice!';
    floatRating(b.lane, rating);
    flashRing(b.lane);
    b.el.classList.add('pop');
    later(() => b.el.remove(), 260);
  }

  // flash a lane's hit ring when a bubble lands there
  function flashRing(i) {
    const ring = laneEls[i].querySelector('.bb-hit');
    if (!ring) return;
    ring.classList.remove('flash');
    void ring.offsetWidth;
    ring.classList.add('flash');
  }

  // a soft nod of every instrument badge, once per beat
  function pulseBeat() {
    game.querySelectorAll('.bb-inst').forEach((el) => {
      el.classList.remove('beat');
      void el.offsetWidth;
      el.classList.add('beat');
    });
  }

  function missBubble(b) {
    b.missed = true;
    combo = 0; setCombo(0);
    b.el.classList.add('miss');
    later(() => b.el.remove(), 320);
  }

  function playInstrumentLane(i) {
    playInstrument(LANES[i], steps[i]);
    steps[i] += 1;
  }

  function bouncePet(i) {
    const el = petEls[i];
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  }

  function floatRating(i, text) {
    const r = document.createElement('span');
    r.className = 'bb-rating';
    r.textContent = text;
    laneEls[i].appendChild(r);
    setTimeout(() => r.remove(), 800);
  }

  // --- meters ---
  function setMeter(p) { meterFill.style.width = Math.max(0, Math.min(1, p)) * 100 + '%'; }
  function setCombo(n) { comboEl.textContent = n >= 3 ? `🔥 ${n}` : ''; }

  // --- win ---
  function win() {
    mode = 'done';
    // Rate the performance by how many beats were hit (always at least 1 star —
    // finishing is the achievement; timing just earns more).
    const acc = total ? hits / total : 1;
    const rating = acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : 1;
    if (curSong && curSong.id && rating > (best[curSong.id] || 0)) { best[curSong.id] = rating; saveBest(); }

    banner.innerHTML = `<span class="bb-banner-stars">${'⭐'.repeat(rating)}</span><span class="bb-banner-text">${hits}/${total} beats!</span>`;
    banner.classList.add('show');
    confetti();
    play('happy');
    // A perfect (all-beats) show pays a couple of bonus stars.
    const reward = award({ stars: rating >= 3 ? 5 : 3, counter: 'bbSongs', stickers: ['bb-first'] });
    if (reward.newStickers.length) later(() => play('point'), 300);
    // little band cheer
    LANES.forEach((id, i) => later(() => playVoice(id), 200 + i * 180));
    later(() => { buildPicker(); showPicker('You rocked! Play again?'); }, 2400);
  }

  function showPicker(msg) {
    mode = 'idle';
    bubbles.forEach((b) => b.el.remove());
    bubbles = [];
    banner.classList.remove('show');
    if (msg) startMsg.textContent = msg;
    startOverlay.classList.remove('hidden');
  }

  const CONFETTI = ['#ff6b9d', '#ffd166', '#2ec4b6', '#5ec8ff', '#bdb2ff', '#ff8c42'];
  function confetti() {
    const n = reduceMotion ? 10 : 28;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'bb-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = CONFETTI[i % CONFETTI.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      stage.appendChild(c);
      later(() => c.remove(), 2400);
    }
  }

  // --- listeners ---
  const onPet = (e) => {
    const i = +e.currentTarget.dataset.lane;
    if (mode === 'play') hitLane(i);
  };
  petEls.forEach((el) => el.addEventListener('click', onPet));

  // --- cleanup ---
  return function unmount() {
    alive = false;
    cancelAnimationFrame(raf);
    cancelSpeech();
    clearTimers();
    petEls.forEach((el) => el.removeEventListener('click', onPet));
    game.remove();
  };
}
