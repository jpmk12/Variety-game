# Fun Game Hub 🎮

<p align="center">
  <img src="assets/animal-care-thumbnail.png" alt="Animal Care — feed, water, bathe and play with a cartoony dog, cat, and unicorn" width="100%" />
</p>

A touch-friendly game hub for kids. The home screen is a menu of games:
- **Animal Care** — look after three cartoony pets (a dog, a cat, and a unicorn)
  by feeding, watering, bathing, brushing, playing, and tucking them in.
- **Letter Samurai** — a gentle "Fruit Ninja" with a learning twist: the game
  says a letter out loud and tosses letters up like fruit; swipe to slash the
  one you heard.

Built as a **zero-build static site**: plain HTML, CSS, and JavaScript (ES
modules) with hand-drawn inline SVG characters. No installs, no bundler, no
dependencies. It hosts anywhere static files can live (e.g. GitHub Pages).

## Play it

ES modules need to be served over HTTP (not opened as a `file://`), so start any
static server from the project root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000 on a tablet or browser
```

## How Animal Care works

- **Two ways to care for a pet:**
  - Tap a pet to select it, then tap a task button, **or**
  - **Drag a treat** (🍖 / 💧 / 🛁 / 🎾) straight from the bar onto any pet.
  - Six tasks: 🍖 **Feed** (tummy), 💧 **Water** (thirst), 🛁 **Bath** (clean),
    🪮 **Brush** (neat & fluffy), 🎾 **Play** (happiness), 🌙 **Night** (rest —
    the room dims and the pet sleeps under the stars).
  - Each task plays a **multi-step animation** so it feels like a real event —
    e.g. a bath goes *lather up → scrub → rinse the suds off → sparkle clean*,
    and feeding goes *bowl in → munch → happy*.
  - Tapping more tasks while one is playing **queues them up** (a little "+2"
    badge shows how many are waiting); they run in order.
- **Each animal has its own voice:** a woof for the dog, a meow for the cat, and
  a sparkly chime for the unicorn (played when it finishes a task or gets a pet).
- **Hidden surprises:** tap the **window** (a sun rises and a bird flies past) or
  the **rainbow picture** (it bursts with sparkles) for a little delight.
- **See how each pet is doing:** every pet has a mood face, and pops up a
  **thought bubble** showing what it wants when a need runs low (tap the bubble
  to give it instantly). The **selected pet's needs meter** sits above the task
  bar with a live bar for food, water, clean, and happy.
- **Pet them:** tap the already-selected pet to give it a cuddle (hearts!).
- **Celebrations:** fill all four needs and the pet does a happy dance with
  confetti and a cheer. Doing a task a pet doesn't need gets a gentle "I'm full!".
- **Lively room:** pets breathe, blink, wag, and do occasional little idle
  flourishes; each species has its own animation touches.
- Stats save to the browser (`localStorage`) and drift down slowly over real
  time, so pets are happy to see you again — but never neglected to misery.
- Use the 🔊 button in the top bar to mute/unmute sounds (sounds are generated
  with the Web Audio API — there are no audio files).

## How Letter Samurai works

- Tap **Start**, then listen: the game says "Slash the letter B!" (device
  text-to-speech) and shows the target letter in the corner.
- Letters are tossed up like fruit. **Swipe through the called letter** to slash
  it — it bursts with juice and sparkles, plays a ding, and your score goes up.
- Slashing the **wrong** letter just puffs away with a soft "oops" — no penalty,
  nothing ends. Tap the 🔊 chip to hear the letter again.
- Rendered on a `<canvas>` with a DOM HUD; respects the same top-bar mute.

## Project layout

```
index.html              app entry; loads js/main.js as a module
css/
  styles.css            theme, hub menu, room, action bar
  animations.css        idle + action keyframes
js/
  main.js               app shell + router (hub <-> game) + top-bar buttons
  hub.js                renders the menu from the registry
  registry.js           list of games (add new games here)
  storage.js            localStorage helpers
  audio.js              Web Audio sound effects + mute
  games/animal-care/
    index.js            game controller (care loop, feedback, celebrations)
    animals.js          dog / cat / unicorn SVG characters
    actions.js          feed / water / bath / play definitions + praise copy
    sequences.js        multi-step animation script for each action
    stats.js            stat model, needs metadata, time decay, mood mapping
    drag.js             pointer drag-and-drop helper (treat → pet)
  games/samurai/
    index.js            canvas game: physics, slicing, waves, HUD
    content.js          letter pool + colors + wave builder
    speech.js           Web Speech API wrapper (says the target letter)
assets/
  favicon.svg, icon-*.png     app icons (tab + home screen)
  animal-care-thumbnail.png   README hero image
scripts/
  hero.html             generates the thumbnail (reuses the real animal art)
```

## Adding another game later

Add an entry to `js/registry.js` with an `id`, `title`, `emoji`, and a
`mount(el)` function that renders into the given element and returns an optional
`unmount()` cleanup. The hub menu picks it up automatically.

## Regenerating the thumbnail

The hero image is a screenshot of `scripts/hero.html` (which reuses the real
pet art). With the dev server running, render it with any headless browser, e.g.
Playwright, capturing the `#hero` element into `assets/animal-care-thumbnail.png`.
