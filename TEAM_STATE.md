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
2. **TODO — Round 2 of the design-team loop** (the original workflow's rounds
   2-3 died on session limits). Re-run review panel (game designer, economy
   analyst w/ sim at sim/balance_sim.js, UX tester) against CURRENT code;
   manager synthesizes; developer implements; QA verifies. Known round-2
   candidates from the verification playtest: the 5:41-8:21 purchase wall
   (consider costMult 1.25x OR a $45-75 mid-tier purchase), rAF-frozen stat
   counters (tickAnimation.js) when tab occluded, decouple word-detection
   income from render throughput (fixed-timestep accumulator), post-35s
   scheduler gems never inject visibly into the feed (injectedGem only set
   from scripted path).
3. **TODO — Re-run verification playtest** after round 2 lands (browser
   playtest vs targets: scarcity 0-3min, purchase cadence 30-90s, 8+ buys
   by min 10, scripted beats, no console errors).
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
