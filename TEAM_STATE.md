# Million Monkeys — Team Work State

> This file is the persistent state for the iterative design/build loop.
> Every agent session MUST: (1) read this file first, (2) update it after
> every completed or failed step, (3) keep entries terse and dated.
> If a step fails with "session limit" / token exhaustion, mark it BLOCKED
> with a timestamp and stop — the hourly loop will retry it.

Last updated: 2026-06-14 (local) — P2-1 done (commit 982cf48)

## Current branch / repo state
- Repo: C:/Users/Owner/Documents/MillionMonkeys2 (github.com/Rob-o-matic/millionmonkeys)
- Branch: `act1-economy-retune` — 5 commits ahead of origin/main, NOT pushed
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
6. **DONE 2026-06-14 — Round 4: UX clarity + Word Counter (commit db51c8a).**
   Found uncommitted changes from a prior session; audited, corrected, and
   committed. Changes kept:
   - StatusBox: pinned persistent alerts (Banana Boat / Breeding Alert);
     now shows last 7 events (was 3).
   - UpgradeButton: "$X more needed" deficit display when unaffordable.
   - Banana: proactive low-supply warning fires at <90s remaining
     (throttled: max once per 120s); doze-recovery resets the throttle.
   - Word Counter upgrade ($350/1.15x): +5% detection per level + WPM
     display; unlocks after first caffeine purchase or 90s play.
   - TIER_WORD_MULTIPLIERS in gameState.js (tier-aware HARVEST_WORD
     reducer, but no caller passes a tier yet — income defaults to 1x).
   Changes REVERTED (loop-rule violations):
   - Monkey cost: $15/1.18x → restored $30/1.25x (loop rule).
   - Breeding starter gift: 30 → 100 bananas (established in round 5 commit).
   19/19 tests, build clean.
7. **ON HOLD — DO NOT PUSH. Owner instruction 2026-06-12 20:14 UTC: "Don't
   push until I say so."** No agent may run git push until the owner
   explicitly lifts this. When lifted: push branch + open PR per create-pr
   instructions (title + body, wrap URL in <pr-created></pr-created> tag).
8. **DEFERRED — CLAUDE.md Phase 1 doc sync** (stale: lists Trained/Editor
   monkeys, $10 word value). Update when owner confirms the Phase 2 curve.

## Phase 2 — authorized 2026-06-14 by owner
Phase 1 exit test is considered passed. Owner has explicitly authorized
Phase 2 implementation. Implement items 9–12 in order.

Key codebase facts agents MUST know before editing:
- src/scheduler.js: selectTier(chaos) — chaos < 0.5 = trained weights
  [T1=50%, T2=35%, T3=12%, T4=3%], chaos >= 0.5 = chaotic [3/12/35/50%]
- src/gameState.js: INITIAL_STATE.scheduler.chaos exists (currently unused
  in App.jsx calls — scheduleNextGem passes 0). ACTIONS.PRESTIGE is a stub
  (reducer returns state unchanged). anthology.words[] holds all words.
- src/App.jsx: useReducer with dispatch(). Main game loop = setInterval
  inside useEffect. scheduleNextGem called with chaos=0 currently.
- UPGRADE_CONFIGS.caffeine = { baseCost:60, costMult:2.0, name:'Caffeine' }
- DO NOT change economy constants (monkey $30/1.25x, caffeine $60/2.0x, $2/word).
- Tests: 19 passing. Run: npm test -- --run. Build: npm run build.
- Git: git -c user.name="Claude Fable 5" -c user.email="noreply@anthropic.com"
- Branch: act1-economy-retune. Never git push.

9.  **DONE 2026-06-14 — P2-1: Better Beans rename + Caffeination Dial (commit 982cf48)**
    - Rename UPGRADE_CONFIGS.caffeine.name 'Caffeine' → 'Better Beans'
      (key stays 'caffeine'; UpgradeButton.jsx description also updated)
    - Add 5-stop caffeination dial replacing the binary chaos param:
      stops 0–4: Decaf/Mild/Regular/Strong/The Jitters, each a tier-weight
      blend [T1,T2,T3,T4] summing to 1.0. Regular (stop 2) ≈ current
      trained weights [0.50, 0.35, 0.12, 0.03].
    - Modify scheduler.js selectTier(weights[]) — accepts weight array,
      drops the chaos param. Export CAFFEINE_DIAL_STOPS array of {label,weights}.
      Update scheduleNextGem signature accordingly. Update scheduler tests.
    - Add to gameState INITIAL_STATE.scheduler: caffeineDialStop:2,
      caffeineDialMetabolizing:false, caffeineDialMetabolizeEnd:null,
      caffeineDialPendingStop:null. Use existing UPDATE_SCHEDULER action.
    - App.jsx: derive dialWeights from dialStop (Decaf when dozing);
      pass to scheduleNextGem. On dial change: dispatch UPDATE_SCHEDULER
      with metabolizing:true, metabolizeEnd:now+60000, pendingStop.
      In game loop: if metabolizing && now > metabolizeEnd → apply
      pendingStop, clear metabolizing state.
    - New CaffeineDial.jsx + CaffeineDial.css: 5 labeled stop buttons,
      60s countdown overlay, locked while metabolizing or dozing.
      Visible after first Better Beans purchase (caffeine >= 1).
    - Render <CaffeineDial> in App.jsx when caffeine >= 1.
    - 19+ tests passing, build clean, commit.

10. **TODO — P2-2: Anthology Collection**
    - Add ACTIONS.COLLECT_WORD to gameState.js. Reducer: adds entry to
      anthology.collected (new field: []), increments totalWordsEver,
      does NOT add to resources.words (collected, not sold).
    - Add anthology.collected:[] to INITIAL_STATE.anthology.
    - App.jsx handleWordDetected: tier<=2 → HARVEST_WORD (unchanged);
      tier>=3 → COLLECT_WORD. Fire a pinned StatusBox alert on collection
      ("📖 Rare find anthologized: '<text>'"). Clear pinned after 8s.
    - Page bonus: every 10 entries in anthology.collected = a completed
      page → dispatch ADD_MONEY($500) + StatusBox "📖 Page complete! +$500".
      Track with a ref so bonus fires exactly once per page milestone.
    - New Anthology.jsx: collapsible panel listing anthology.collected
      entries (text + tier label). Show "N phrases collected · N pages".
      Visible after first entry is collected.
    - Anthology.css: uses existing token variables. Frozen visual style
      (Build Rule 3: anthology tokens scoped, don't drift).
    - 19+ tests passing, build clean, commit.

11. **TODO — P2-3: Espresso Shot**
    - Hot-streak event: a monkey "glows" at random intervals (60–180s,
      uniform random) while not dozing and monkey count > 0.
    - State in App.jsx (local useState): espressoAvailable(bool),
      espressoActive(bool), espressoEndRef(useRef for timestamp).
    - EspressoAvailable expires after 30s if not pressed.
    - On press: if espressoActive → extend by 3s (cap at 20s total
      remaining); else → start 10s burst. Update espressoEndRef.
    - Detection loop: multiply getDetectionsPerSecond result × 3 when
      espressoActive. Recalculate espressoActive each tick from endRef.
    - Dozing overrides: espresso event never fires while dozing;
      if dozing starts during a burst, end burst immediately.
    - New EspressoButton.jsx: glowing monkey "☕" button with countdown
      ring; appears only when espressoAvailable or espressoActive.
    - EspressoButton.css: keyframe glow animation, countdown display.
      All colors via CSS variables.
    - 19+ tests passing, build clean, commit.

12. **TODO — P2-4: Prestige ("Publish a Volume")**
    - Unlock condition: anthology.collected.length >= 5.
    - Implement ACTIONS.PRESTIGE reducer (currently a stub):
      Reset resources to INITIAL_STATE.resources (except money = $30 +
      prestige bonus), reset upgrades (except keep tenure monkeys),
      keep anthology.collected, increment a new prestige.count field.
      Tenure rule: keep 1 monkey per completed prestige (so prestige 1
      starts with 1 monkey, prestige 2 with 2, etc., cap 5).
    - Add to INITIAL_STATE: prestige: { count: 0 }.
    - Add ACTIONS.PRESTIGE to ACTIONS enum; implement in reducer.
    - App.jsx: add handlePrestige() that dispatches PRESTIGE, shows
      a full-screen AlertModal with title "Volume N Published!", then
      resets key local state (breedingUnlocked→false, dozing→false,
      espresso state, etc. — anything that reflects pre-prestige game).
    - Add PrestigeButton.jsx: "Publish a Volume" button visible when
      anthology.collected.length >= 5. Shows collected count. Uses
      ribbon-ink accent. Confirmation step (click once to arm, click
      again to confirm within 5s).
    - PrestigeButton.css.
    - 19+ tests (add at least one prestige reducer test), build clean,
      commit.

## Loop discipline
- One queue item per loop iteration is fine; update this file after each.
- On token/session-limit failure: append "BLOCKED <timestamp> <item>" below
  and end the session cleanly. Next hourly run retries.
- Phase 2 is AUTHORIZED (2026-06-14). Work items 9–12 in order.
- Do NOT start Phase 3 (Act 2: word market, drift ladder) until owner confirms
  Phase 2 exit test passed.

## Blocked log
(none yet)
