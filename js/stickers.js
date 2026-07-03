// The sticker book catalog — every collectible across all games. Some unlock
// from an explicit event (a game calls award({stickers:['id']})); others carry
// a `when(state, helpers)` predicate that progress.js auto-checks after any
// award (milestones on the star wallet, lifetime counters, or a pet's bond).

export const GROUPS = ['Animal Care', 'Letter Samurai', 'Climb & Spell', 'Beat Buddies', 'Counting Market', 'Milestones'];

export const STICKERS = [
  // --- Animal Care: one per activity, earned the first time you win it ---
  { id: 'ac-first',   group: 'Animal Care', emoji: '🐾', name: 'First Friend',   hint: 'Care for a pet' },
  { id: 'ac-bath',    group: 'Animal Care', emoji: '🫧', name: 'Bubble Master',  hint: 'Finish a bath' },
  { id: 'ac-feed',    group: 'Animal Care', emoji: '🍖', name: 'Pet Chef',       hint: 'Feed a pet full' },
  { id: 'ac-water',   group: 'Animal Care', emoji: '💧', name: 'Water Bearer',   hint: 'Fill the water bowl' },
  { id: 'ac-brush',   group: 'Animal Care', emoji: '🪮', name: 'Top Groomer',    hint: 'Brush a pet shiny' },
  { id: 'ac-play',    group: 'Animal Care', emoji: '🎾', name: 'Best Playmate',  hint: 'Win a game of play' },
  { id: 'ac-night',   group: 'Animal Care', emoji: '🌙', name: 'Lullaby Singer', hint: 'Tuck a pet into bed' },
  // Bond milestone — auto-unlocks when ANY pet reaches friendship level 3.
  { id: 'ac-bond3',   group: 'Animal Care', emoji: '❤️', name: 'Best Friends',   hint: 'Reach friendship level 3',
    when: (s, h) => ['dog', 'cat', 'unicorn', 'bunny'].some((p) => h.getBond(p).level >= 3) },
  { id: 'ac-bond5',   group: 'Animal Care', emoji: '💞', name: 'Soul Mates',     hint: 'Reach friendship level 5',
    when: (s, h) => ['dog', 'cat', 'unicorn', 'bunny'].some((p) => h.getBond(p).level >= 5) },
  { id: 'ac-style',   group: 'Animal Care', emoji: '🛍️', name: 'Fashionista',    hint: 'Buy something at the shop' },
  { id: 'ac-trick',   group: 'Animal Care', emoji: '🎓', name: 'Star Pupil',      hint: 'Graduate Trick School' },
  { id: 'ac-hatch',   group: 'Animal Care', emoji: '🐣', name: 'Egg Hatcher',     hint: 'Hatch the mystery egg' },

  // --- Letter Samurai: counter milestones on correct slashes ---
  { id: 'sam-first', group: 'Letter Samurai', emoji: '⚔️', name: 'First Slash',  hint: 'Slash the right letter' },
  { id: 'sam-10',    group: 'Letter Samurai', emoji: '🥋', name: 'Yellow Belt',  hint: 'Slash 10 correct',
    when: (s) => (s.counters.samCorrect || 0) >= 10 },
  { id: 'sam-25',    group: 'Letter Samurai', emoji: '🥷', name: 'Black Belt',   hint: 'Slash 25 correct',
    when: (s) => (s.counters.samCorrect || 0) >= 25 },
  { id: 'sam-streak',group: 'Letter Samurai', emoji: '🔥', name: 'On Fire',      hint: 'Get a streak of 5' },

  // --- Climb & Spell: words spelled + web hero ---
  { id: 'cs-first', group: 'Climb & Spell', emoji: '🕸️', name: 'First Word',    hint: 'Spell a whole word' },
  { id: 'cs-5',     group: 'Climb & Spell', emoji: '📖', name: 'Word Wizard',   hint: 'Spell 5 words',
    when: (s) => (s.counters.csWords || 0) >= 5 },
  { id: 'cs-web',   group: 'Climb & Spell', emoji: '🦸', name: 'Web Hero',      hint: 'Web up a baddie' },

  // --- Beat Buddies: songs finished ---
  { id: 'bb-first', group: 'Beat Buddies', emoji: '🎵', name: 'First Gig',    hint: 'Finish a song' },
  { id: 'bb-3',     group: 'Beat Buddies', emoji: '🎤', name: 'Showstopper',  hint: 'Finish 3 songs',
    when: (s) => (s.counters.bbSongs || 0) >= 3 },
  { id: 'bb-10',    group: 'Beat Buddies', emoji: '🌟', name: 'Rock Star',    hint: 'Finish 10 songs',
    when: (s) => (s.counters.bbSongs || 0) >= 10 },

  // --- Counting Market: market days completed ---
  { id: 'cm-first', group: 'Counting Market', emoji: '🧺', name: 'Shopkeeper',    hint: 'Finish a market day' },
  { id: 'cm-3',     group: 'Counting Market', emoji: '🍎', name: 'Fruit Seller',  hint: 'Finish 3 market days',
    when: (s) => (s.counters.cmDays || 0) >= 3 },
  { id: 'cm-10',    group: 'Counting Market', emoji: '🏪', name: 'Market Master', hint: 'Finish 10 market days',
    when: (s) => (s.counters.cmDays || 0) >= 10 },

  // --- Milestones: the star wallet ---
  { id: 'stars-25',  group: 'Milestones', emoji: '⭐', name: 'Star Collector', hint: 'Earn 25 stars',
    when: (s) => s.stars >= 25 },
  { id: 'stars-100', group: 'Milestones', emoji: '🌟', name: 'Star Hoarder',   hint: 'Earn 100 stars',
    when: (s) => s.stars >= 100 },
  { id: 'stars-250', group: 'Milestones', emoji: '💫', name: 'Superstar',      hint: 'Earn 250 stars',
    when: (s) => s.stars >= 250 },
];

export function stickerById(id) { return STICKERS.find((s) => s.id === id) || null; }
