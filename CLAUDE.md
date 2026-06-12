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

**Exit test:** Do players form a strategy opinion (chaos vs trained)? Do they prestige voluntarily?

### Phase 3 — Act 2: The Content Empire
1. Revenue resource + the 12-step drift upgrade ladder
2. "Share of all text on Earth" stat with silent reveal
3. Era-appropriate flavor and slow UI re-skin (warmer farm palette → corporate slate)
4. Act 2 → 3 trigger event (Shakespeare completion beat)

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

