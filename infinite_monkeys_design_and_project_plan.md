# INFINITE MONKEYS — Design Review & Project Plan

A narrative incremental game in 3 acts. Working title: **Infinite Monkeys**.
This document is the output of a 4-lens design review (retention, systems/economy, UX, narrative) plus the build plan.

---

## Part 1: Design Review Findings

Four designer lenses were applied. Each found problems. Each problem has a fix that made it into the spec.

### Lens 1 — Retention Design

**Finding 1.1: The first 60 seconds were unscripted. That's where games die.**
Fix: the opening is fully authored, disguised as randomness.
- 0:08 — first real word appears (guaranteed). Big highlight, satisfying ding, +bananas.
- 0:20 — second word. Player has now learned the loop without a tutorial.
- 0:35 — first purchasable upgrade becomes affordable (Monkey #2).
- 0:45 — scripted near-miss: "to be or not to bq" with a special flicker. Teaches heartbreak and the Shakespeare premise in one beat.
- 0:60 — first Tier 2 long word. Player has felt 3 distinct reward sizes inside 1 minute.

**Finding 1.2: No purchase cadence spec. Incremental games live or die on "time to next buy."**
Fix: for the first 10 minutes, something new is affordable every 30–60 seconds. Minutes 10–30: every 1–3 minutes. After that, idle accrual carries the gaps. Cost curve: each upgrade tier costs 1.15x the last purchase in its track (genre-standard, proven).

**Finding 1.3: No reason to come back tomorrow.**
Fix: three return hooks, all soft (no dark-pattern streaks):
- Idle accrual with a Harvest Report on return ("While you were gone: 2.1M keystrokes, 312 words, 1 anomaly"). Capped at 8 hours so there's no penalty anxiety.
- Pity timers that mature over real time: a Tier 4 anomaly is guaranteed within every 24h window of play.
- Anthology page bonuses: completing a page (e.g., all 3-letter animals) pays a multiplier. Always leave 1–2 pages visibly near-complete.

**Finding 1.4: Novelty cadence.** Paperclips reveals a new mechanic roughly every 5–7 minutes for the first hour. We match that. Act 1 unlock order: 2nd monkey → editor monkey → chaos slider → anthology tab → prestige tease → first revenue option (the act 2 seed).

### Lens 2 — Systems & Economy Design

**Finding 2.1: The gem scheduler is the real game and needs a hard spec.**
The character stream is cosmetic. Rewards come from an authored scheduler:

| Tier | Content | Base interval (active play) | Pity timer |
|------|---------|------------------------------|------------|
| 1 | Real word, 3–6 letters | every 4–10s | 15s |
| 2 | Long word, 7+ letters | every 45–90s | 3 min |
| 3 | Phrase (2+ words) | every 4–8 min | 12 min |
| 4 | Anomaly / accidental poetry | every 10–20 min | 24h real time |
| 5 | Shakespeare fragment | scripted beats only | n/a |

Intervals scale down with monkey count (more monkeys = faster schedule), but never below 50% of base. The player must always be able to perceive individual events. A reward you can't notice is a reward you didn't get.

**Finding 2.2: The chaos slider needs two real loot tables.**
- Trained (low chaos): Tier 1–3 intervals shortened 30%. Tier 4 lengthened 50%.
- Chaotic (high chaos): reverse. Plus exclusive anomaly types (almost-words, corrupted quotes) only roll at high chaos.
One slider, two builds, both viable. Switching is free but takes 60s to "retrain" — prevents toggle-cheesing the scheduler.

**Finding 2.3: Prestige (added to Act 1, was missing).**
"Publish a Volume": reset monkeys and upgrades, keep the Anthology forever, gain Tenure (permanent +10% all output per volume, mild exponential). First prestige is offered around minute 45 when growth visibly flattens. Prestige is also the narrative on-ramp to Act 2 — publishing is what attracts the money.

**Finding 2.4: Active vs idle balance.** Active play earns 2.5x idle rate via manual taps on Tier 2+ and 20-second "hot streak" events (a monkey glows; tapping extends a 3x output burst). Never more than 3x, or idle players feel robbed.

### Lens 3 — UX & Game Feel

**Finding 3.1: Word detection is the game's job, reaction is the player's.**
Words auto-highlight with a glow and a 3-second grace window before scrolling off. Rarity = bigger glow + longer window (Tier 5 pauses the feed entirely). No visual-search misery, no missed jackpots.

**Finding 3.2: Juice budget is not optional. It IS the addiction.**
- Typewriter clack audio (toggleable), pitch varies per monkey.
- Ding scale: small ding (T1) → chime (T2) → fanfare (T3+) → feed-stop + spotlight (T5).
- All numbers tick upward, never jump. Banana counter rolls.
- Harvested words physically fly into the Anthology tab.
- Near-misses get a red flicker and a soft "aww" sting. The near-miss is a feature, schedule it (1 per 2–3 min).

**Finding 3.3: One screen, three zones.** Feed (top, dominant), economy buttons (middle), tabs (bottom: Anthology / Stats / Settings). Mobile-first layout; tap targets ≥ 48px. New tabs do not exist until unlocked — hidden, not greyed out. Greyed-out is a spoiler.

### Lens 4 — Narrative Design

**Finding 4.1: Drift pacing.** Act 2's upgrade-name drift runs over ~12 purchases, one notch each. Rule: any single button shown out of context must pass as reasonable. The horror lives between buttons. A "Share of all text on Earth" stat appears silently after the 3rd revenue upgrade — no announcement, players discover it.

**Finding 4.2: One bar, three meanings.** The same progress-bar UI element carries each act: Shakespeare % → Share of Earth's text % → Library of Babel %. Players learn to fear the bar they laughed at.

**Finding 4.3: Flavor text cadence.** One line of deadpan flavor per upgrade and per anomaly title. Anomalies get pompous auto-titles ("Fragment No. 7: On Cats"). This is the screenshot-and-share engine — protect it.

**Finding 4.4: Act triggers.**
- Act 1 → 2: first prestige ("A publisher has noticed your Volume.").
- Act 2 → 3: Shakespeare bar completes at ~85% Earth-text share. "The complete works have been typed. The monkeys have not stopped."
- Endings: Completion ("The rest is silence.") or Release (open the cages; keep only the Anthology).

---

## Part 2: Project Plan

### Phase 1 — Act 1 Core (the playable farm)
Deliverable: a fully playable Act 1, fun on its own with no knowledge of Acts 2–3.
1. Character feed renderer with authored gem scheduler and highlight/grace system
2. Scripted first-60-seconds sequence
3. Banana economy: monkeys, trained monkeys, editor monkeys, caffeine; 1.15x cost curve
4. Tier 1–2 harvesting, audio dings, number tick animation
5. Stats panel + the Shakespeare progress bar (cosmetic, crawling)

Exit test: does an uncoached player play 10+ minutes and buy 8+ upgrades?

### Phase 2 — Collection & Depth
1. Anthology with pages, page-completion bonuses, verbatim saved finds
2. Tier 3 phrases and Tier 4 anomalies with auto-titles
3. Chaos slider with the two loot tables and 60s retrain timer
4. Hot-streak tap events; idle accrual + Harvest Report
5. Prestige ("Publish a Volume") with Tenure

Exit test: do players form a strategy opinion (chaos vs trained)? Do they prestige voluntarily?

### Phase 3 — Act 2: The Content Empire
1. Revenue resource + the 12-step drift upgrade ladder
2. "Share of all text on Earth" stat with silent reveal
3. Era-appropriate flavor and slow UI re-skin (warmer farm palette → corporate slate)
4. Act 2 → 3 trigger event (Shakespeare completion beat)

Exit test: do playtesters report the "wait, what am I doing?" moment unprompted?

### Phase 4 — Act 3: The Library + Endings
1. Matter/energy resources, orbital and planetary projects
2. Library of Babel bar, cosmic-scale number formatting (scientific notation)
3. Both endings, including the hidden Release option
4. Post-ending state (the single monkey, still tappable)

### Phase 5 — Persistence & Polish
1. Save/load via artifact persistent storage (survives sessions); manual reset option
2. Full balance pass against the cadence targets in Part 1
3. Juice pass: particles, feed-stop jackpot moment, audio mix
4. Mobile layout verification

### Tuning targets (measured in playtests)
- Time to first reward: ≤ 10 seconds
- Time to first purchase: ≤ 60 seconds
- First session length: 15+ minutes median
- Players reaching Act 2: ≥ 50% of those who prestige
- Unprompted "share of Earth" realization: reported by majority of Act 2 testers

### Build approach
Single React artifact, state-machine architecture from day one: `{act, resources, upgrades, anthology, scheduler}` so Acts 2–3 bolt onto Act 1 without rework. Act 2–3 content ships dormant behind triggers — the Phase 1 build already contains the door, just not the rooms.

### Ethics note
The addiction toolkit here (variable ratio, pity timers, near-misses, collection gaps) is standard for the genre and benign in context: no monetization, no streak punishment, capped idle anxiety, and a game that is literally *about* runaway optimization. The Release ending is the game forgiving the player for playing it.

---

## Part 3: Art Direction — "The Interface Is the Narrator"

The design team's brief back: beautiful is not a coat of paint here. The game's story is told by upgrade names and one progress bar — the visual identity is the third narrator. So the art direction has one governing idea: **the UI itself drifts through the three acts, continuously, without ever announcing it.** Not three themes with a switch. One set of design tokens that interpolate as the player progresses, so slowly that no single session looks different, but a screenshot from hour 1 and hour 4 look like different games. The player should feel the change before they can name it.

### Act 1 — "The Study"

The world: a typewriter on a wooden desk. Everything derives from real typewriter materiality — ink, ribbon, paper, brass.

**Palette (CSS variables, these are the t=0 token values):**
- `--paper: #F6F1E5` — aged paper, slightly warm
- `--ink: #211D1A` — typewriter ink, never pure black (ink is never pure)
- `--ribbon-red: #A8362B` — the red half of a two-tone typewriter ribbon. This is the accent, and it is grounded: real ribbons are black-and-red. Used for near-misses, alerts, and the Shakespeare bar.
- `--brass: #B08D3E` — the bell, the bananas, the payouts. Muted, not gold-foil gaudy.
- `--platen: #4A4440` — rubber-roller gray for secondary UI, borders, disabled states

**Type:** monospace carries the identity, almost everywhere. Feed: Special Elite (typewriter face with ink irregularity) or Courier Prime fallback. UI labels and headers: the same mono, set in caps with letter-spacing — headers are *typed*, e.g. underlined with a row of `=` characters as a structural device. Numbers/data: Courier Prime tabular. One utility sans (system stack) for fine print only. No display serif. The manuscript IS the brand; a fancy serif would say "publisher," and in Act 1 we are not a publisher yet. That restraint is the setup for Act 2's punchline.

**Texture and feel:** faint paper grain on the background (CSS noise, subtle). Buttons are stamped: 1px ink border, no border-radius, press state shifts them 1px down like a key. Harvested words are paper slips that fly to the Anthology tab. No shadows anywhere — paper is flat.

**Motion:** letters in the feed stamp in with ±1px jitter and slight ink-density variation per character. Carriage-return shove when a feed line ends. The brass ding scales with tier. Hot-streak monkey gets a margin doodle, not a glow. All motion behind `prefers-reduced-motion`.

### Act 2 — "The Firm" (the drift)

As revenue upgrades accumulate, tokens interpolate over ~12 purchase steps:
- `--paper` whitens toward `#FCFCFD`; the grain texture fades to zero
- `--ink` cools toward slate `#212A36`
- `--ribbon-red` desaturates and shifts toward a corporate teal `#1A7F74` ("engagement" color)
- `--brass` becomes flat chart-green `#3E9B5F` — money stops being a bell sound and becomes a metric
- Border-radius creeps in: 0px → 8px across the act. Drop shadows appear. Buttons stop pressing down and start "lifting."
- Headers lose their typed `=` underlines, swap from mono caps to a clean sans (Inter or system), gain icon chips
- The feed shrinks. By late Act 2 it's a small panel in a dashboard of KPIs — the monkeys becoming a line item is told by layout alone

**The one exception, and it's the signature element of the whole game: the Anthology never drifts.** It keeps Act 1's paper, ink, mono, and grain forever — through Act 3, through the endings. Opening it from a slate dashboard or from the void should feel like opening a shoebox of letters. This contrast is the emotional mechanism of both endings, and it costs nothing: it's just a scoped set of un-interpolated tokens.

### Act 3 — "The Void"

The dashboard thins out and goes dark — not a dark mode toggle, a continuation of the same interpolation:
- Background to `#0A0B0F`, near-void; UI chrome dissolves, panels lose borders, layout becomes vast negative space
- Text becomes thin, light, wide-tracked; the corporate sans stays but at light weights — the firm hollowed out
- The feed returns to center stage as a single luminous stream — phosphor amber `#E8B458`, monkey output as the only light in the frame. Monospace returns with it. The typography comes full circle: the game ends in the face it began with, which is the visual rhyme for "the rest is silence."
- Numbers go scientific notation, set small. At this scale, big numbers whisper.

### Rules for the build (put these in CLAUDE.md verbatim)

1. All colors, radii, shadows, and font assignments live in CSS custom properties. No hardcoded values in components, ever. The drift system is just a function `applyTokens(driftProgress: 0..1)` interpolating between act keyframes.
2. Drift advances only on narrative purchases, never on a timer. Players who stall in Act 1 keep the study forever.
3. The Anthology's tokens are scoped and frozen. Test this explicitly — any leak of drifted tokens into the Anthology is a bug with narrative consequences.
4. Quality floor, unannounced: responsive to 360px, 48px tap targets, visible keyboard focus, WCAG AA contrast at every drift keyframe (check the midpoints too — interpolated colors can fail contrast where endpoints pass), reduced-motion honored.
5. Restraint: one signature (the frozen Anthology), one accent per act, no decoration that doesn't come from typewriter, office, or void. When in doubt, remove one thing.
