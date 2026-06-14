# Million Monkeys — Team Work State

> This file is the persistent state for the iterative design/build loop.
> Every agent session MUST: (1) read this file first, (2) update it after
> every completed or failed step, (3) keep entries terse and dated.
> If a step fails with "session limit" / token exhaustion, mark it BLOCKED
> with a timestamp and stop — the hourly loop will retry it.

Last updated: 2026-06-13 (local)

## Current branch / repo state
- Repo: C:/Users/Owner/Documents/MillionMonkeys2 (github.com/Rob-o-matic/millionmonkeys)
- Branch: `act1-economy-retune` — 3 commits ahead of origin/main, NOT pushed
  (push blocked on interactive GitHub sign-in; owner will authenticate later;
  agents must NOT attempt workarounds, just retry `git push -u origin act1-economy-retune`
  and move on if it fails)
- Tests: 18/18 passing. Build: clean. Dev server usually running at http://localhost:5173
  (node not on PATH — use "C:\Program Files\nodejs" prefix; gh CLI not installed)
- Commit identity: commit with `git -c user.name="Claude Fable 5" -c user.email="noreply@anthropic.com"`
  (do NOT invent a human author identity)

## Done (round 1 + verification fixes)
- Economy retune: $2/word, no combo income, 1.30x monkey curve, breeding trickle,
  caffeine wired up (+10% detection/purchase), Shakespeare denominator 100k
- Onboarding: scripted sequence anchored to first monkey purchase; scripted gems +
  near-miss render in feed; whole-token highlighting; one-lit-button start
- Bug fixes: scripted-gem comparator (was completely dead), CRLF dictionary
  poisoning, setState-in-render in Feed, unbounded feed buffer (capped ~5k chars),
  handleWordDetected stabilized with useCallback
- Verified live in browser: all 7 scripted beats + near-miss fire, console clean
- CLAUDE.md: added "Word Market Arc" (flat $2 Act 1 = novelty economy / "buyers
  think it's cute"; Act 2 = cuteness wears off, monkeys compete with humans —
  price slider, demand curve, glut meter) and "Banana Economy" (Phase 2,
  doze-not-starve, breeding-alert gate) sections

## Work queue (in priority order)
1. **DONE 2026-06-12 — Caffeine final spec + documentation.** Designer ruled:
   caffeination dial (chaos slider skinned, 5 stops Decaf→The Jitters, 60s
   metabolize, unlocks on first "Better Beans" purchase = renamed $60 caffeine
   rung, economics unchanged) stays Phase 2/Act 1; owner's 10-12s press-boost
   ships as the Espresso Shot skin of the hot-streak event (Finding 2.4);
   nothing chaos-related moves to Act 2 (word-market stepper is Act 2's only
   new control). Documented in CLAUDE.md Phase 2 items 3-4 + Phase 3 item 6,
   and design doc Findings 2.2/2.4. Committed.
2. **DONE 2026-06-12 ~17:00 UTC — Round 2 of the design-team loop.** All four
   issues fixed, QA-passed, committed:
   A (purchase wall): monkey costMult 1.30->1.25 (sim: worst wait 57s, 18+
   purchases by min 10; the $45-75 mid-tier item candidate was tested and
   REJECTED — worst wait unchanged, adds a third button to the opening).
   B (frozen counters): tickAnimation hidden-tab instant snap + duration+150ms
   watchdog + cancel fns wired in Stats.jsx.
   C (income decoupling): detection income moved to a 250ms wall-clock
   fixed-timestep accumulator in App.jsx via getDetectionsPerSecond in
   economy.js; Feed's generator tick is pure cosmetics now.
   D (visible scheduler gems): src/phrases.js (12 tier-3 + 6 tier-4 phrases,
   pickGemText); post-scripted scheduler branch injects gems into the feed
   (8s min gap), RARE FIND StatusBox lines.
3. **DONE 2026-06-12 (QA portion) — verification playtest.** QA browser
   session (~7 min): scripted beats + near-miss render; ladder $30/38/47
   correct; counters track with rAF dead AND document.hidden; foreground/
   background income parity; scheduler gems visibly inject (incl. tier-3
   "such sweet sorrow"); zero console errors. Full 10-min cadence run was
   sim+spot-check covered. The OWNER'S manual playtest (Phase 1 exit test:
   uncoached 10+ min, 8+ purchases) is still the gate for Phase 2.
4. **DONE 2026-06-12 — Round 3 (quality floor + scheduler cadence), 19/19
   tests (new scheduler-clamp test added), build clean, NOT yet committed:**
   - R3-1 scheduler.js: exported MAX_GEM_INTERVAL_MS=45000; non-scripted
     gem gap clamped — rarity stays in selectTier's weights, a tier-3/4
     award no longer silences discoveries for 60s-20min. App's 8s floor kept.
   - R3-2 integration.test.js: 60s economy sim seeded (mulberry32(1337) via
     vi.spyOn(Math,'random'), restored in afterEach) — was flaky.
   - R3-3 App.jsx: population-based drift effect REMOVED (Build Rule 2:
     drift only on narrative purchases, none exist in Act 1) — replaced by
     mount-only applyTokens(0); drift-0.75 gray-on-gray collapse no longer
     reachable in Phase 1. SET_DRIFT/driftProgress plumbing intact.
   - R3-4 tokens: new Act 1 derived inks in tokens.css/.anthology/tokens.js
     (--brass-ink #665020, --harvest-ink #1d5c38, --status-breeding #11505f,
     --ribbon-ink #8E2E25, --harvest-green/--harvest-tint); --brass darkened
     #B08D3E -> #A28439 (3.16 on paper for non-text borders AND 4.70 vs ink
     for the warning-hover — the spec's #9A7B33 candidate failed the latter
     at 4.19, so a lighter value satisfying BOTH constraints was derived).
   - R3-5..R3-10 CSS: StatusBox (breeding #7dd3fc->token, purchase/discovery
     to ink variants), Feed (harvest inks + tint tokens/color-mix), Stats
     (stat-value brass-ink; progress-text paper chip instead of text-shadow),
     UpgradeButton + App.css sell button (text to brass-ink, borders stay
     brass; automated border -> --status-breeding), AlertModal (amber/red ->
     brass/ribbon-red, warning hover text = ink, criticalPulse color-mix).
   - R3-11: contrast_audit.mjs extended (new-token checks at drift 0, exits
     1 on failure) and moved to sim/contrast_audit.mjs — ALL CHECKS PASS;
     npm test 19/19; build clean; fresh-localStorage browser pass at 1280px
     and 360px: ~10 min live run, 89 discoveries with max visible gap 26s,
     two tier-3 RARE FINDs with no post-award drought, breeding alert at 8
     monkeys with brass border + teal "monkeys born" lines readable, drift
     pinned (paper unchanged at 15 monkeys incl. bred), no 360px overflow,
     all tap targets >= 48px (alert button's 43px reading was the
     modalSlideIn scale(0.9) mid-animation), zero console errors/warnings.
5. **DONE 2026-06-13 — Banana economy (Act 1 tension layer).** Full
   implementation per design spec: banana resource in gameState; sublinear
   consumption rate (population^0.8 / 30 bananas/sec); mean-reverting price
   walk ($0.05–$0.18, ±8% per 5s tick, 15% mean-pull); rare Banana Boat
   event (~3%/tick, 50% off for 20s with ding); dozing state when bananas=0
   (feed fills with zzz at 25% speed, ambience off, breeding paused, stat
   shows "troop is dozing!" in amber); 100 starter bananas gifted at
   breeding alert with updated alert copy; Buy 100 🍌 button gated at
   breeding unlock; all verified in browser (doze, recovery, price display,
   stat time-remaining). Build clean, no console errors. NOT yet committed.
6. **ON HOLD — DO NOT PUSH. Owner instruction 2026-06-12 20:14 UTC: "Don't
   push until I say so."** No agent may run git push until the owner
   explicitly lifts this. When lifted: push branch + open PR per create-pr
   instructions (title + body, wrap URL in <pr-created></pr-created> tag).
7. **DEFERRED — CLAUDE.md Phase 1 doc sync** (stale: lists Trained/Editor
   monkeys, $10 word value). Deliberately waits until the OWNER's manual
   playtest confirms the curve. Do not do this until owner confirms.

## Loop discipline
- One queue item per loop iteration is fine; update this file after each.
- On token/session-limit failure: append "BLOCKED <timestamp> <item>" below
  and end the session cleanly. Next hourly run retries.
- Never start Phase 2 implementation — Phase 1 exit test (owner's manual
  playtest) has not passed yet.

## Blocked log
(none yet)
