# Million Monkeys — Team Work State

> This file is the persistent state for the iterative design/build loop.
> Every agent session MUST: (1) read this file first, (2) update it after
> every completed or failed step, (3) keep entries terse and dated.
> If a step fails with "session limit" / token exhaustion, mark it BLOCKED
> with a timestamp and stop — the hourly loop will retry it.

Last updated: 2026-06-12 ~08:30 (local)

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
4. **TODO — Push branch + open PR** once GitHub auth works. PR per
   create-pr instructions: title + body, wrap URL in <pr-created></pr-created> tag.
5. **DEFERRED — CLAUDE.md Phase 1 doc sync** (stale: lists Trained/Editor
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
