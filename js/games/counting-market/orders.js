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

export const fruitById = (id) => FRUITS.find((f) => f.id === id);

const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function sample(arr, n, exclude = []) {
  const pool = arr.filter((x) => !exclude.includes(x));
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

// Build an order for a level. Returns:
//   { items: [{fruitId, count}], bins: [fruitId…], speak: '…', sentence: [{count,emoji}] }
// `bins` is which fruit piles the child can drag from (order fruits + distractors).
export function makeOrder(level) {
  const ids = FRUITS.map((f) => f.id);
  let items;
  let distractors;

  if (level <= 1) {
    // one item, count 1–5, no distractors
    items = [{ fruitId: pick(ids), count: rnd(1, 5) }];
    distractors = [];
  } else if (level === 2) {
    // one item, count 2–8, with one wrong-fruit pile to pick past
    const target = pick(ids);
    items = [{ fruitId: target, count: rnd(2, 8) }];
    distractors = sample(ids, 1, [target]);
  } else {
    // two different items, counts 1–4 each
    const two = sample(ids, 2);
    items = two.map((id) => ({ fruitId: id, count: rnd(1, 4) }));
    distractors = sample(ids, 1, two);
  }

  const bins = [...items.map((it) => it.fruitId), ...distractors];
  const sentence = items.map((it) => ({ count: it.count, emoji: fruitById(it.fruitId).emoji }));
  const speak = items
    .map((it) => `${it.count} ${fruitById(it.fruitId).name}${it.count > 1 ? 's' : ''}`)
    .join(' and ') + ' please!';

  return { items, bins, sentence, speak };
}
