# Million Monkeys — Build Guide

## Tech Stack
- **Frontend:** Vite + React (single-page app, no backend)
- **Deployment:** Static files (no server required)
- **State management:** Centralized game state machine
- **Styling:** CSS custom properties with interpolation system

## Game State Machine
```
{
  act,           // 1, 2, or 3
  resources,     // words, money, matter, energy
  upgrades,      // purchased upgrade state
  anthology,     // collected words and pages
  scheduler      // gem/reward scheduler with intervals and pity timers
}
```

Acts 2 and 3 are dormant behind triggers — Phase 1 builds the door, not the rooms.

---

## Phase 1 — Act 1 Core (COMPLETE)

✅ **Deliverable:** A fully playable Act 1 with immediate onboarding and engaging feedback loop.

### Core Loop
1. **Start:** $30 money, 0 monkeys
2. **First action:** Buy monkey (button is affordable on load)
3. **Monkeys produce:** Words typed in real-time (75% gibberish, 10% real words, 15% spaces)
4. **Discoveries:** Tier 1 words appear every 2-5s, Tier 2 phrases every 20-40s (scripted for 0-35s)
5. **Harvesting:** Words highlighted green when discovered, added to inventory
6. **Auto-sell:** Every 5 words → auto-convert to money ($10/word)
7. **Reinvest:** Buy more monkeys/upgrades → faster typing → more words → loop accelerates

### Economy Model
- **Resources:** Words (inventory) + Money (currency)
- **Upgrades:**
  - Monkeys ($30): base producers
  - Trained Monkeys ($150): 1.5x faster
  - Editor Monkeys ($600): 2x faster
  - Caffeine ($60): 1.1x boost
  - Sales Monkey ($2000): auto-converts words to money (passive income)
- **Cost curve:** 1.15x multiplier per purchase
- **Word value:** $10 per word when sold

### Scripted Sequence (0-35s)
- 0:02 — "the" (first discovery)
- 0:04 — "monkey" (pattern emerges)
- 0:06 — "million monkeys" (bigger discovery, Tier 2)
- 0:10 — "shakespeare"
- 0:15 — "complete"
- 0:20 — "complete works" (Tier 2)
- 0:28 — "type"
- 0:35 — "to be or not to bq" (near-miss, teaches heartbreak)

After 35s: probability-based gem scheduler takes over.

### UI/UX
- **Feed:** Real-time typewriter text with green highlights on discovered words
- **Stats:** Words, Money, Monkeys, Shakespeare progress bar
- **Economy buttons:** Monkey, Trained Monkey, Editor Monkey, Caffeine (Sales Monkey unlocks after 3min or $1000)
- **Onboarding:** ">> Buy monkey to start." when inventory is empty
- **Scaling:** Character generation speed scales with monkey count (2x faster per monkey)

### Generation Speeds
- **Base character interval:** 40ms (2x per character vs. earlier 80ms)
- **Tier 1 gems:** Every 2-5s (accelerated from 4-10s)
- **Tier 2 gems:** Every 20-40s (accelerated from 45-90s)
- **Feed generation:** 10% real words, 75% gibberish = feels chaotic but discoverable

### Exit Test
✅ **Goal:** Uncoached player plays 10+ minutes and buys 8+ upgrades.
- Time to first purchase: ~1 min (buy monkey with starting $30)
- Time to first reward: 2s (first word harvested)
- First session length: 15+ minutes (with accelerated discovery, achievable)

**Status:** Phase 1 ready for final playtest.

---

## 5-Phase Project Plan with Exit Tests

### Phase 2 — Collection & Depth (NEXT)
1. Anthology with pages, page-completion bonuses, verbatim saved finds
2. Tier 3 phrases and Tier 4 anomalies with auto-titles
3. Chaos slider with the two loot tables and 60s retrain timer
4. Hot-streak tap events; idle accrual + Harvest Report
5. Prestige ("Publish a Volume") with Tenure
6. Banana economy (see "Banana Economy" section below) — gated at the
   breeding alert, designed TOGETHER with idle accrual (#4), never bolted on
7. Optional, only if the exit test needs fuel: Tier 3/4 finds can sell at
   fixed premiums (e.g. $25/phrase) vs. anthologizing forever — cash-now vs.
   collection decision, zero RNG

**Exit test:** Do players form a strategy opinion (chaos vs trained)? Do they prestige voluntarily?

### Phase 3 — Act 2: The Content Empire
1. Revenue resource + the 12-step drift upgrade ladder
2. "Share of all text on Earth" stat with silent reveal
3. Era-appropriate flavor and slow UI re-skin (warmer farm palette → corporate slate)
4. Act 2 → 3 trigger event (Shakespeare completion beat)
5. Word market becomes Act 2's core verb (see "Word Market Arc" section
   below): player-set price vs. demand curve, market saturation/glut meter,
   marketing rungs on the drift ladder drive demand

**Exit test:** Do playtesters report the "wait, what am I doing?" moment unprompted?

### Phase 4 — Act 3: The Library + Endings
1. Matter/energy resources, orbital and planetary projects
2. Library of Babel bar, cosmic-scale number formatting (scientific notation)
3. Both endings, including the hidden Release option
4. Post-ending state (the single monkey, still tappable)

**Exit test:** (Narrative validation; completion signifier)

### Phase 5 — Persistence & Polish
1. Save/load via artifact persistent storage (survives sessions); manual reset option
2. Full balance pass against the cadence targets
3. Juice pass: particles, feed-stop jackpot moment, audio mix
4. Mobile layout verification

**Exit test:** (Deployment-ready; verified on mobile)

---

## Word Market Arc (designed 2026-06-12, panel review)

**The narrative spine: the novelty economy.** In Act 1, selling words is easy
and prices are flat because **buyers think it's cute** — "a monkey typed this!"
is a novelty product, and novelty buyers don't haggle. Every word fetches an
honest $2, the market asks no questions, and the SELL button is a pure
cash-register moment. In Act 2, **the cuteness wears off**. The market stops
paying for the gimmick and starts paying for *volume* — and now the monkeys are
competing with human writers for human markets, and winning. The mechanical
introduction of pricing, demand, and marketing IS this narrative beat: the
moment the player first has to *think* about selling is the moment the monkeys
stop being adorable and start being an industry.

### Act 1 (Phase 1, SHIPPED): flat pricing, by design
- Words sell at flat $2 (`DOLLARS_PER_WORD`). No variance, ever, in Act 1.
- Rationale (panel verdict): the SELL button's job is legibility and rhythm,
  not optimization. Flat pricing keeps the `+$N` preview honest, keeps every
  press a win, and keeps the Sales Monkey's automation never-worse-than-manual
  (automation worse than the thing it automates is the genre's cardinal sin).
- Rejected for Act 1: random price walks (rewards NOT pressing the core
  button; noise for a first-3-minutes audience), demand saturation (throttles
  a button that's already naturally paced), price slider (wrong complexity for
  the cozy study; competes with Phase 2's chaos slider).
- Flavor hook to seed now or in Phase 2 polish: occasional StatusBox lines
  from charmed buyers ("a collector wants more of this!") to establish that
  the market is buying the *novelty*. This is the setup Act 2 pays off.

### Act 2 (Phase 3): the market grows up
- **Opening beat:** demand for novelty words visibly sags (a one-time scripted
  dip — the only unearned price movement in the game), and the first drift
  rung ("Hire a Publicist") unlocks the price control. The lesson: the market
  no longer wants cute; it wants *content*.
- **Model (deterministic, player-driven — Paperclips' lesson is that the
  player must be the source of variance):**
  - `demand = baseDemand × audienceMult / price^elasticity`, elasticity 1.2–1.5
  - Saturation layer: `marketGlut` meter (0–1) fills when selling above
    demand, decays ~2%/s; effective price = listPrice × (1 − 0.6 × glut).
    Restraint visibly recovers price. Thematically: you are flooding the
    market with monkey-typed content and the price of *all text* is falling.
  - `audienceMult` IS the 12-step drift ladder: each marketing/distribution
    rung multiplies demand 2–4x, and is what moves "share of all text on
    Earth" — the market engine and the horror stat are one system. Each rung
    makes the market *want* more of the slop: that's the drift.
- **Continuity:** price control unlocks at default $2 list price so the Act 1
  anchor carries over.
- **UI:** sell panel grows a price stepper (− $0.10 +), a one-line demand
  readout ("the market wants N words/s at this price"), and a thin glut bar.
  The `+$N` ground truth stays.
- **Automation ladder (attention handoff into Act 3):** Sales Monkey (dumb
  auto-sell, carries over) → "Sales Department" (sells only up to demand,
  never floods) → "Algorithmic Desk" (auto-optimizes price; retires the
  minigame right as Act 3 approaches).

---

## Banana Economy (designed 2026-06-12, panel review — Phase 2)

**The job:** Act 1 post-Sales-Monkey has no reason to check back in. Bananas
are this game's "wire" (Universal Paperclips): a consumable input with a live
price, a forecastable deadline (stock ÷ burn = minutes until stall), a
dip-sniping minigame, and an automation catharsis. Bonus: bananas are the
missing counterweight to breeding — population stops being a free lunch and
becomes something you manage.

**The structural difference from wire (and the fix):** in Paperclips the
player chooses their burn rate by buying clippers; here breeding grows the
upkeep bill autonomously while gem income is population-independent, so
linear cost + sublinear income = a death spiral the player didn't author.
The fix is severity, not tuning: zero bananas is a SOFT stall.

- **Zero bananas = doze, never starve.** Typing ramps down over ~20s to 25%
  speed (never 0 — a dead feed reads as a bug), the feed fills with
  "zzzzz mmmm zzz" (the gibberish gets more gibberish), ambience thins,
  **breeding pauses** (sleeping monkeys don't breed — required, or offline
  players return to a huge hungry troop). Nothing is lost; recovery is
  instant on feeding. Starvation/death is rejected: the dark turn is Act 2's
  job, and Act 1 never destroys purchased capital.
- **Introduction:** gated at the 8-monkey BREEDING ALERT (~min 3–4). The
  alert already says population growth is automatic; append "...and they're
  hungry." Nothing banana-related on screen before that moment — the first
  three minutes stay two-button simple.
- **Price:** mean-reverting random walk. Base $0.10/banana, range
  $0.05–$0.18, tick ~5s, ±8% steps drifting to mean. Rare event: "Banana
  boat arrives!" — 50% off for 20s with a ding. That event is the
  check-back-in hook and the skill layer.
- **Consumption:** 1 banana / monkey / 30s. Display as time remaining, not
  burn rate: "🍌 240 — feeds the troop for 6m" (amber under 60s). Target:
  upkeep = 10–20% of gross income through mid-game. Tuning gate: scale troop
  consumption sublinearly past ~50 monkeys (population^0.8) so the
  cost/income curves can't cross.
- **Buying:** one button, "Buy 100 🍌 — $9.40", live unit price inline; bulk
  tiers (1k, 10k) unlock with population.
- **Automation:** "Banana Contract" $3,500 (next rung after Sales Monkey's
  $2,000) — auto-buys when stock < 90s of supply at WHATEVER the current
  price is, deliberately dumb (WireBuyer's lesson: dumb automation relieves
  the obligation without deleting the skill layer). Optional upgrade:
  "Shrewd Procurement Monkey" $8,000 — buys only below mean unless critical.
- **Idle coupling (design together, not after):** offline, stock depletes,
  then monkeys doze — idle earnings are capped by banana stock until the
  Contract is bought. This is the genre's "no idling until automation
  permits it" pacing valve for free. The Harvest Report MUST say "monkeys
  slept after bananas ran out at 2h 14m" or capped earnings read as a bug.
- **Balance budget:** bananas are a second money sink against the freshly
  tuned 1.30x monkey curve — expect a balance pass (word value $2 → $2.25–
  2.50, or cheaper early bananas). Budgeted, not free.
- **Sequencing rule:** never introduce two ongoing-management mechanics in
  the same session-minute (bananas vs. chaos-slider retrain vs. hot-streak
  taps — stagger the unlocks).

---

## Build Rules (Part 3, verbatim)

1. All colors, radii, shadows, and font assignments live in CSS custom properties. No hardcoded values in components, ever. The drift system is just a function `applyTokens(driftProgress: 0..1)` interpolating between act keyframes.
2. Drift advances only on narrative purchases, never on a timer. Players who stall in Act 1 keep the study forever.
3. The Anthology's tokens are scoped and frozen. Test this explicitly — any leak of drifted tokens into the Anthology is a bug with narrative consequences.
4. Quality floor, unannounced: responsive to 360px, 48px tap targets, visible keyboard focus, WCAG AA contrast at every drift keyframe (check the midpoints too — interpolated colors can fail contrast where endpoints pass), reduced-motion honored.
5. Restraint: one signature (the frozen Anthology), one accent per act, no decoration that doesn't come from typewriter, office, or void. When in doubt, remove one thing.

---

## Build Discipline

**Work one phase at a time. Never start the next phase until the user confirms the current phase's exit test passed.**

---

## Tuning Targets (measured in playtests)
- Time to first reward: ≤ 10 seconds ✅ (2s scripted)
- Time to first purchase: ≤ 60 seconds ✅ (can afford immediately)
- First session length: 15+ minutes median ✅ (accelerated discovery)
- Players reaching Act 2: ≥ 50% of those who prestige (Phase 2+)
- Unprompted "share of Earth" realization: reported by majority of Act 2 testers (Phase 3+)

