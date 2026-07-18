// The sticker book catalog — every collectible across all games. Some unlock
// from an explicit event (a game calls award({stickers:['id']})); others carry
// a `when(state, helpers)` predicate that progress.js auto-checks after any
// award (milestones on the star wallet, lifetime counters, or a pet's bond).

export const GROUPS = ['Animal Care', 'Letter Samurai', 'Climb & Spell', 'Beat Buddies', 'Counting Market', 'Pet Pairs', 'Shape Sorters', 'Word Builders', 'Metal Makers', 'Tic-Tac-Toe', 'Connect Four', 'Milestones'];

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
    when: (s, h) => ['dog', 'cat', 'unicorn', 'bunny', 'dragon'].some((p) => h.getBond(p).level >= 3) },
  { id: 'ac-bond5',   group: 'Animal Care', emoji: '💞', name: 'Soul Mates',     hint: 'Reach friendship level 5',
    when: (s, h) => ['dog', 'cat', 'unicorn', 'bunny', 'dragon'].some((p) => h.getBond(p).level >= 5) },
  { id: 'ac-style',   group: 'Animal Care', emoji: '🛍️', name: 'Fashionista',    hint: 'Buy something at the shop' },
  { id: 'ac-trick',   group: 'Animal Care', emoji: '🎓', name: 'Star Pupil',      hint: 'Graduate Trick School' },
  { id: 'ac-hatch',   group: 'Animal Care', emoji: '🐣', name: 'Egg Hatcher',     hint: 'Hatch the mystery egg' },
  { id: 'ac-dragon',  group: 'Animal Care', emoji: '🐉', name: 'Dragon Friend',   hint: 'Hatch the dragon egg' },
  { id: 'ac-decor',   group: 'Animal Care', emoji: '🏡', name: 'Decorator',       hint: 'Decorate the room' },

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
  { id: 'cm-add',   group: 'Counting Market', emoji: '➕', name: 'Little Adder',   hint: 'Solve an adding order' },
  { id: 'cm-3',     group: 'Counting Market', emoji: '🍎', name: 'Fruit Seller',  hint: 'Finish 3 market days',
    when: (s) => (s.counters.cmDays || 0) >= 3 },
  { id: 'cm-10',    group: 'Counting Market', emoji: '🏪', name: 'Market Master', hint: 'Finish 10 market days',
    when: (s) => (s.counters.cmDays || 0) >= 10 },

  // --- Pet Pairs: memory boards cleared ---
  { id: 'mm-first',   group: 'Pet Pairs', emoji: '🃏', name: 'Good Memory',    hint: 'Clear a memory board' },
  { id: 'mm-perfect', group: 'Pet Pairs', emoji: '🧠', name: 'Perfect Recall', hint: 'Clear a board with no wrong flips' },
  { id: 'mm-names',   group: 'Pet Pairs', emoji: '🔤', name: 'Word Finder',    hint: 'Clear a board in Names mode' },
  { id: 'mm-3',       group: 'Pet Pairs', emoji: '👀', name: 'Sharp Eyes',     hint: 'Clear 3 boards',
    when: (s) => (s.counters.mmWins || 0) >= 3 },
  { id: 'mm-10',      group: 'Pet Pairs', emoji: '🏆', name: 'Memory Master',  hint: 'Clear 10 boards',
    when: (s) => (s.counters.mmWins || 0) >= 10 },

  // --- Shape Sorters: sorting days completed ---
  { id: 'ss-first', group: 'Shape Sorters', emoji: '🔺', name: 'Sorter',        hint: 'Finish a sorting day' },
  { id: 'ss-color', group: 'Shape Sorters', emoji: '🎨', name: 'Color Sorter',  hint: 'Finish a sort-by-color day' },
  { id: 'ss-3',     group: 'Shape Sorters', emoji: '🟦', name: 'Sorting Pro',   hint: 'Finish 3 sorting days',
    when: (s) => (s.counters.ssDays || 0) >= 3 },
  { id: 'ss-10',    group: 'Shape Sorters', emoji: '🏆', name: 'Sort Master',   hint: 'Finish 10 sorting days',
    when: (s) => (s.counters.ssDays || 0) >= 10 },

  // --- Word Builders: words built ---
  { id: 'wb-first',  group: 'Word Builders', emoji: '🔨', name: 'Builder',         hint: 'Build your first word' },
  { id: 'wb-nohint', group: 'Word Builders', emoji: '🏗️', name: 'Master Builder',  hint: 'Build a word with no hint' },
  { id: 'wb-5',      group: 'Word Builders', emoji: '🧱', name: 'Word Site',       hint: 'Build 5 words',
    when: (s) => (s.counters.wbWords || 0) >= 5 },
  { id: 'wb-15',     group: 'Word Builders', emoji: '👷', name: 'Head Contractor', hint: 'Build 15 words',
    when: (s) => (s.counters.wbWords || 0) >= 15 },

  // --- Metal Makers: workshop creations ---
  { id: 'met-first',  group: 'Metal Makers', emoji: '🔧', name: 'Metal Maker',   hint: 'Finish a metal creation' },
  { id: 'met-weld',   group: 'Metal Makers', emoji: '⚡', name: 'Welder',        hint: 'Weld a seam' },
  { id: 'met-rivet',  group: 'Metal Makers', emoji: '🔩', name: 'Riveter',       hint: 'Place a rivet' },
  { id: 'met-master', group: 'Metal Makers', emoji: '🏆', name: 'Master Smith',  hint: 'Build the trophy' },

  // --- Tic-Tac-Toe: three in a row ---
  { id: 'ttt-first', group: 'Tic-Tac-Toe', emoji: '⭕', name: 'Let\'s Play',      hint: 'Play a game of Tic-Tac-Toe' },
  { id: 'ttt-win',   group: 'Tic-Tac-Toe', emoji: '✖️', name: 'Three in a Row',  hint: 'Win a game' },
  { id: 'ttt-ai',    group: 'Tic-Tac-Toe', emoji: '🤖', name: 'Computer Beater', hint: 'Beat the computer' },

  // --- Connect Four: four in a row ---
  { id: 'c4-first', group: 'Connect Four', emoji: '🔴', name: 'First Drop',      hint: 'Play a game of Connect Four' },
  { id: 'c4-win',   group: 'Connect Four', emoji: '🟡', name: 'Four in a Row',   hint: 'Win a game' },
  { id: 'c4-ai',    group: 'Connect Four', emoji: '🤖', name: 'Computer Beater', hint: 'Beat the computer' },

  // --- Milestones: the star wallet ---
  { id: 'stars-25',  group: 'Milestones', emoji: '⭐', name: 'Star Collector', hint: 'Earn 25 stars',
    when: (s) => s.stars >= 25 },
  { id: 'stars-100', group: 'Milestones', emoji: '🌟', name: 'Star Hoarder',   hint: 'Earn 100 stars',
    when: (s) => s.stars >= 100 },
  { id: 'stars-250', group: 'Milestones', emoji: '💫', name: 'Superstar',      hint: 'Earn 250 stars',
    when: (s) => s.stars >= 250 },
];

export function stickerById(id) { return STICKERS.find((s) => s.id === id) || null; }
