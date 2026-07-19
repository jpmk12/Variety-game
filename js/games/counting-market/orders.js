// Content for Counting Market. A customer's order is one or two fruit "items",
// each a { fruitId, count }. Difficulty grows with the level: bigger counts,
// then a wrong-fruit distractor to pick past, then two-item orders.

export const FRUITS = [
  { id: 'apple',      emoji: '🍎', name: 'apple' },
  { id: 'banana',     emoji: '🍌', name: 'banana' },
  { id: 'orange',     emoji: '🍊', name: 'orange' },
  { id: 'strawberry', emoji: '🍓', name: 'strawberry' },
  { id: 'grape',      emoji: '🍇', name: 'grape' },
  { id: 'cherry',     emoji: '🍒', name: 'cherry' },
];

// Hand-drawn inline SVG for each fruit, so the market matches the vector pets
// instead of mixing in flat OS emoji. All share a 0 0 100 100 viewBox.
const FRUIT_SVG = {
  apple: `<svg viewBox="0 0 100 100" class="cm-fruit-svg" aria-hidden="true">
    <rect x="47" y="16" width="6" height="18" rx="3" fill="#7a4a25"/>
    <path d="M53 26 C64 14 80 18 73 31 C66 42 53 37 53 26Z" fill="#5ec98a"/>
    <path d="M50 32 C38 18 17 26 17 47 C17 69 36 88 50 88 C64 88 83 69 83 47 C83 26 62 18 50 32Z" fill="#ef3f3f"/>
    <ellipse cx="35" cy="47" rx="8" ry="13" fill="#fff" opacity="0.35"/></svg>`,
  banana: `<svg viewBox="0 0 100 100" class="cm-fruit-svg" aria-hidden="true">
    <path d="M20 34 C22 64 44 84 76 76 C86 73 86 63 79 65 C56 73 40 58 37 35 C36 27 22 27 20 34Z" fill="#ffd23e"/>
    <path d="M20 34 C22 64 44 84 76 76 C60 74 42 62 38 40 C36 30 30 28 20 34Z" fill="#f2b429" opacity="0.55"/>
    <path d="M76 76 l9 -3 -5 9Z" fill="#7a5a2a"/><rect x="18" y="26" width="7" height="10" rx="3" fill="#8a6a2a"/></svg>`,
  orange: `<svg viewBox="0 0 100 100" class="cm-fruit-svg" aria-hidden="true">
    <path d="M50 24 C58 13 73 15 67 28 C61 37 50 33 50 24Z" fill="#5ec98a"/>
    <circle cx="50" cy="55" r="33" fill="#ff9f2e"/>
    <circle cx="50" cy="24" r="3.5" fill="#c56a12"/>
    <ellipse cx="38" cy="45" rx="9" ry="11" fill="#fff" opacity="0.28"/></svg>`,
  strawberry: `<svg viewBox="0 0 100 100" class="cm-fruit-svg" aria-hidden="true">
    <path d="M50 42 C42 30 30 30 30 34 C40 34 44 40 50 42 C56 40 60 34 70 34 C70 30 58 30 50 42Z" fill="#5ec98a"/>
    <rect x="47" y="20" width="6" height="14" rx="3" fill="#5ec98a"/>
    <path d="M50 90 C29 77 23 57 27 44 C31 35 44 36 50 42 C56 36 69 35 73 44 C77 57 71 77 50 90Z" fill="#ef3f3f"/>
    <g fill="#ffe08a"><ellipse cx="41" cy="55" rx="2" ry="3"/><ellipse cx="54" cy="53" rx="2" ry="3"/><ellipse cx="48" cy="66" rx="2" ry="3"/><ellipse cx="60" cy="64" rx="2" ry="3"/><ellipse cx="36" cy="66" rx="2" ry="3"/></g></svg>`,
  grape: `<svg viewBox="0 0 100 100" class="cm-fruit-svg" aria-hidden="true">
    <rect x="48" y="12" width="5" height="12" rx="2" fill="#7a4a25"/>
    <path d="M53 20 C63 12 76 16 70 26 C64 34 53 29 53 20Z" fill="#5ec98a"/>
    <g fill="#9b5de5"><circle cx="50" cy="34" r="10"/><circle cx="39" cy="48" r="10"/><circle cx="61" cy="48" r="10"/><circle cx="31" cy="62" r="10"/><circle cx="50" cy="62" r="10"/><circle cx="69" cy="62" r="10"/><circle cx="40" cy="76" r="10"/><circle cx="60" cy="76" r="10"/></g>
    <g fill="#fff" opacity="0.25"><circle cx="46" cy="31" r="3"/><circle cx="35" cy="45" r="3"/><circle cx="27" cy="59" r="3"/></g></svg>`,
  cherry: `<svg viewBox="0 0 100 100" class="cm-fruit-svg" aria-hidden="true">
    <path d="M56 22 C40 34 32 50 36 64 M56 22 C70 34 74 52 66 66" stroke="#6a8a2a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M56 22 C64 12 80 14 74 26 C68 34 56 30 56 22Z" fill="#5ec98a"/>
    <circle cx="35" cy="70" r="15" fill="#e6394f"/><circle cx="66" cy="72" r="15" fill="#e6394f"/>
    <circle cx="30" cy="65" r="4" fill="#fff" opacity="0.35"/><circle cx="61" cy="67" r="4" fill="#fff" opacity="0.35"/></svg>`,
};

export const fruitById = (id) => FRUITS.find((f) => f.id === id);
export const fruitSVG = (id) => FRUIT_SVG[id] || '';

const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function sample(arr, n, exclude = []) {
  const pool = arr.filter((x) => !exclude.includes(x));
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

// Build an order for a level. Returns:
//   { items: [{fruitId, count}], bins: [fruitId…], addition, speak, sentence }
// `items` is always what must end up in the basket (for addition, the total).
// `bins` is which fruit piles the child can drag from (order fruits + distractors).
// `addition` is set on Day 4+ ("a + b of one fruit — how many?").
export function makeOrder(level) {
  const ids = FRUITS.map((f) => f.id);
  let items;
  let distractors;
  let addition = null;

  if (level <= 1) {
    // one item, count 1–5, no distractors
    items = [{ fruitId: pick(ids), count: rnd(1, 5) }];
    distractors = [];
  } else if (level === 2) {
    // one item, count 2–8, with one wrong-fruit pile to pick past
    const target = pick(ids);
    items = [{ fruitId: target, count: rnd(2, 8) }];
    distractors = sample(ids, 1, [target]);
  } else if (level === 3) {
    // two different items, counts 1–4 each
    const two = sample(ids, 2);
    items = two.map((id) => ({ fruitId: id, count: rnd(1, 4) }));
    distractors = sample(ids, 1, two);
  } else {
    // Day 4+: addition — put out a + b of one fruit (count the total)
    const fruit = pick(ids);
    const a = rnd(1, 3);
    const b = rnd(1, 3);
    items = [{ fruitId: fruit, count: a + b }];
    // Day 4 (the cap) also puts out one wrong-fruit pile to pick past, so the
    // adding day still exercises "grab only the right fruit".
    distractors = level >= 4 ? sample(ids, 1, [fruit]) : [];
    addition = { a, b, fruitId: fruit, emoji: fruitById(fruit).emoji, svg: fruitSVG(fruit) };
  }

  const bins = [...new Set([...items.map((it) => it.fruitId), ...distractors])];
  const sentence = items.map((it) => ({ count: it.count, emoji: fruitById(it.fruitId).emoji, svg: fruitSVG(it.fruitId) }));
  const speak = addition
    ? `${addition.a} plus ${addition.b} ${fruitById(addition.fruitId).name}s. How many?`
    : items.map((it) => `${it.count} ${fruitById(it.fruitId).name}${it.count > 1 ? 's' : ''}`).join(' and ') + ' please!';

  return { items, bins, addition, sentence, speak };
}
