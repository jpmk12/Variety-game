// Daily treat — a small "welcome back" reward that grows with a day streak, to
// give kids (and their star wallet) a reason to come back. Per-profile, since
// storage.js namespaces the save key. Claiming pays out stars through the
// reward economy, so star milestones still auto-unlock.

import { load, save } from './storage.js';
import { award, getStars } from './progress.js';

const KEY = 'daily';
const BASE = 5;         // stars just for showing up
const PER_DAY = 2;      // extra stars per day of streak
const MAX_BONUS = 10;   // cap on the streak bonus
export const CYCLE = 7; // the streak calendar loops every 7 days

// Local calendar date as YYYY-MM-DD (a "day" is the child's local day).
export function todayStr(d = new Date()) {
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}

// Whole-day index, for checking whether two dates are exactly one day apart.
function dayNum(str) {
  const [y, m, d] = str.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function read() {
  const s = load(KEY, null) || {};
  return { lastClaim: s.lastClaim || null, streak: s.streak || 0 };
}

// What the daily treat looks like right now (without claiming it yet).
export function status(today = todayStr()) {
  const s = read();
  const claimedToday = s.lastClaim === today;
  let streak;
  if (claimedToday) {
    streak = s.streak;
  } else if (s.lastClaim && dayNum(today) - dayNum(s.lastClaim) === 1) {
    streak = (s.streak || 0) + 1;   // came back the very next day
  } else {
    streak = 1;                     // first visit, or the streak lapsed
  }
  const reward = claimedToday ? 0 : BASE + Math.min(MAX_BONUS, (streak - 1) * PER_DAY);
  const cycleDay = ((streak - 1) % CYCLE) + 1;
  return { claimedToday, streak, reward, cycleDay };
}

// Claim today's treat. Pays out stars once per day; a no-op if already claimed.
export function claim(today = todayStr()) {
  const st = status(today);
  if (st.claimedToday) return { claimed: false, ...st };
  save(KEY, { lastClaim: today, streak: st.streak });
  award({ stars: st.reward });
  return { claimed: true, ...st, stars: getStars() };
}

// Test/inspection hook.
if (typeof window !== 'undefined') {
  window.__daily = { status, claim, todayStr };
}
