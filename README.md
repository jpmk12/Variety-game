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
- **Climb & Spell** — a masked climber hero crawls and web-swings between letter
  perches; the game says "Crawl/Swing to C!" and reaching the right letters in
  order spells simple words.

Built as a **zero-build static site**: plain HTML, CSS, and JavaScript (ES
modules) with hand-drawn inline SVG characters. No installs, no bundler, no
dependencies. It hosts anywhere static files can live (e.g. GitHub Pages).

## Play it

**Online:** https://jpmk12.github.io/Variety-game/ — open it on a tablet and,
for a full-screen app feel, use the browser's **Add to Home Screen**. (Published
via GitHub Pages set to **Deploy from a branch → `main`**; the site is the repo
root, and `.nojekyll` makes it serve files as-is.)

**Locally:** ES modules need to be served over HTTP (not opened as a `file://`),
so start any static server from the project root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000 on a tablet or browser
```

## How Animal Care works

Animal Care is a little **three-view** world: the **room** of pets → a **zoomed
pet** → an interactive **mini-game** for each chore. Every task is now its own
hands-on game with a goal meter you fill to win.

- **Tap a pet to zoom in.** The pet fills the screen with its six **needs meters**
  (food, water, clean, tidy, happy, rest) and six **task buttons**. A "← Room"
  button takes you back to all the pets.
- **Each task is its own mini-game** with a **goal meter** — fill it to win, then
  a celebration plays, that need tops up to full, and you're back on the pet to
  pick the next chore. No timers and no way to lose — the meter fills purely by
  doing the activity, which suits young kids.
  - 🛁 **Bath** — *scrub* the dirt spots off by dragging over the pet (each one
    turns to suds), then *rinse* the bubbles away. The Clean meter fills as you
    scrub and rinse → squeaky-clean shine.
  - 🍖 **Feed** — **drag treats** (🍖🦴🍗🥩🍪) to the pet's mouth; it chews with a
    happy bounce and the Food meter fills.
  - 💧 **Water** — **hold to pour** water into the bowl; when it's full the pet
    laps it down and the Water meter fills.
  - 🪮 **Brush** — **stroke over the fur** to smooth the messy tufts and add
    shine; the Tidy meter fills as the knots clear.
  - 🎾 **Play** — **tap the bouncing ball** to rally it back and forth; each hit
    makes the pet hop and fills the Happy meter.
  - 🌙 **Night** — the room dims; **gently pat** the sleepy pet (tap) as 💤 float
    up, and the Rest meter fills until it drifts off to sleep.
- **Each animal has its own voice:** a woof for the dog, a meow for the cat, and
  a sparkly chime for the unicorn (played when it wins a mini-game).
- **See how each pet is doing:** in the room every pet has a mood face and pops
  up a **thought bubble** showing what it wants when a need runs low; zoom in to
  see all six meters at a glance.
- **Celebrations:** winning a mini-game bursts confetti and cheers, and the pet
  strikes a happy pose (chewing, hopping, sleeping…).
- **Reduced-motion aware:** honors the system "reduce motion" setting.
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
- **Settings** (on the start screen, or the ⚙️ button in-game): choose what to
  slash — **Letters / Numbers / Both** — and the **Speed** (🐢 Slow / 🚶 Medium /
  🐇 Fast, which changes how long the glyphs float). Choices are saved.
- Rendered on a `<canvas>` with a DOM HUD; respects the same top-bar mute.

## How Climb & Spell works

- Tap **Start**. The game shows a word as blanks and tells you (on screen + out
  loud) **"Crawl to C!"** or **"Swing to C!"**.
- The reachable perches glow; near ones are a **crawl**, farther ones a **swing**
  (the hero shoots a web line and arcs over). Several are reachable at once, so
  there are multiple paths.
- Tap the perch with the called letter → the hero crawls/swings there and the
  letter drops into the word. Reaching the right letters in order **spells the
  word** (CAT, DOG, SUN…), then a celebration and a new word.
- Wrong perch? A soft "oops" and it re-says the letter — no penalty.
- **Baddies:** now and then an original cartoon critter scuttles onto the wall —
  tap it to **web it up for +5** points (score shows 🕸️ top-left). They're our
  own designs (a goblin/octo/rhino bug), not based on any trademarked character.
- The hero is an **original** masked climber (our own colors + a star emblem),
  not based on any trademarked character.

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
    index.js            router across room / zoomed pet / mini-game views
    animals.js          dog / cat / unicorn SVG characters
    actions.js          feed / water / bath / play definitions + praise copy
    stats.js            stat model, needs metadata, time decay, mood mapping
    minigames/
      index.js          maps an action id to its mini-game module
      shell.js          shared mini-game shell: goal meter + pet stage + win
      bath.js           scrub the dirt off, then rinse the suds
      feed.js           drag treats to the pet's mouth
      water.js          hold to pour the bowl full
      brush.js          stroke over the fur to smooth the tufts
      play.js           tap the ball to rally a happy pet
      night.js          dim the room and pat the pet to sleep
  games/samurai/
    index.js            canvas game: physics, slicing, waves, HUD
    content.js          letter pool + colors + wave builder
    speech.js           Web Speech API wrapper (says the target letter)
  games/climb-spell/
    index.js            wall scene, perch reachability, crawl/swing movement
    hero.js             original masked-climber SVG
    words.js            3-letter word list + distractor helper
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
