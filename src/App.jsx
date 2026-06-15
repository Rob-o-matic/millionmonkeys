import React, { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import { gameReducer, INITIAL_STATE, ACTIONS } from './gameState';
import { applyTokens } from './tokens';
import { StartScreen } from './components/StartScreen';
import { Feed } from './components/Feed';
import { Stats } from './components/Stats';
import { UpgradeButton } from './components/UpgradeButton';
import { EngineIndicator } from './components/EngineIndicator';
import { StatusBox } from './components/StatusBox';
import { SectorChart } from './components/SectorChart';
import { AlertModal } from './components/AlertModal';
import {
  createScheduler,
  scheduleNextGem,
} from './scheduler';
import { getNextCost, canAfford as canAffordUpgrade, getBreedingBonuses, getDetectionsPerSecond, getBananaConsumptionRate, getBananaTimeRemaining, UPGRADE_CONFIGS, DOLLARS_PER_WORD, BANANA_PRICE_BASE, BANANA_PRICE_MIN, BANANA_PRICE_MAX, BANANA_BUY_COUNT } from './economy';
import { pickGemText } from './phrases';
import { playDing, playNearMissSound, playSellSound, resumeAudioContext, startTypingAmbience, stopTypingAmbience } from './audio';
import {
  isScriptedPhase,
  getCurrentScriptedGem,
} from './scripting';
import './App.css';

export function App() {
  const [gameState, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [gameStarted, setGameStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const [events, setEvents] = useState([]);
  const [comboCount, setComboCount] = useState(0);
  const [breedingUnlocked, setBreedingUnlocked] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [lastMarketingMilestone, setLastMarketingMilestone] = useState(0);
  const [injectedGem, setInjectedGem] = useState(null);
  const [bananaPrice, setBananaPrice] = useState(BANANA_PRICE_BASE);
  const [bananaBoat, setBananaBoat] = useState(false);
  const [dozing, setDozing] = useState(false);
  const [pinnedAlert, setPinnedAlert] = useState(null);
  const bananaPriceRef = useRef(BANANA_PRICE_BASE);
  const bananaBoatRef = useRef(false);
  const bananaBoatEndRef = useRef(null);
  const bananaConsumeAccRef = useRef(0);
  const dozingRef = useRef(false);
  const lastBananaWarnRef = useRef(0);
  const schedulerRef = useRef(createScheduler());
  const startTimeRef = useRef(Date.now());
  const scriptStartRef = useRef(null);
  const lastHarvestTimeRef = useRef({});
  const lastAutoSaleRef = useRef(Date.now());
  const lastBreedingTimeRef = useRef(Date.now());
  const lastWordDetectionRef = useRef(0);
  const bredSinceLastReportRef = useRef(0);
  const lastBreedReportRef = useRef(Date.now());
  const comboCountRef = useRef(0);
  const recentHarvestsRef = useRef(new Map());
  const dictionaryRef = useRef([]);
  /* Fixed-timestep detection accumulator (issue C): income is computed here
     on wall-clock time, never inside Feed's render-coupled generator tick */
  const detectionAccRef = useRef(0);
  const lastDetectionTickRef = useRef(null);
  /* Assigned every render so the detection interval reads fresh values
     without effect churn */
  const liveStateRef = useRef({ monkeys: 0, caffeine: 0, wordCounter: 0 });
  liveStateRef.current = {
    monkeys: gameState.upgrades.monkeys,
    caffeine: gameState.upgrades.caffeine,
    wordCounter: gameState.upgrades.wordCounter || 0,
  };

  /* Load dictionary on mount */
  useEffect(() => {
    fetch('/words.txt')
      .then(res => res.text())
      .then(text => {
        const words = text.split(/\r?\n/).map(w => w.trim()).filter(w => w.length > 0);
        dictionaryRef.current = words;
      })
      .catch(err => console.error('Failed to load dictionary:', err));
  }, []);

  // Format elapsed time as timestamp
  const getTimestamp = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add event with timestamp
  const addEvent = (type, message) => {
    setEvents(prev => [...prev, {
      type,
      message: `[${getTimestamp()}] ${message}`,
      timestamp: Date.now()
    }]);
  };

  /* Build Rule 2: drift advances only on NARRATIVE PURCHASES, never on a
     timer or a population count — and narrative purchases don't exist in
     Act 1, so Phase 1 drift is pinned at 0 (the study stays the study).
     The old population-milestone drift (0.25/0.5/0.75/1.0 at 100/250/500/
     1000 monkeys, bred monkeys included) violated that rule and made the
     drift-0.75 gray-on-gray contrast collapse reachable in Phase 1.
     SET_DRIFT / driftProgress plumbing stays intact for Phase 3. */
  useEffect(() => {
    applyTokens(0);
  }, []);

  /* Update elapsed time */
  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted]);

  /* Reset timing when game starts */
  useEffect(() => {
    if (gameStarted) {
      startTimeRef.current = Date.now();
      schedulerRef.current.nextGemTime = 2000; // First gem at 2 seconds
      lastHarvestTimeRef.current = {};
      setElapsedSeconds(0);
    }
  }, [gameStarted]);

  /* Listen for '/' key to toggle indicator */
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '/') {
        e.preventDefault();
        setShowIndicator((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  /* Resume audio context on user interaction */
  useEffect(() => {
    const handleClick = () => {
      resumeAudioContext();
      document.removeEventListener('click', handleClick);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  /* Banana price walk: mean-reverting random walk every 5s. Rare banana boat event. */
  useEffect(() => {
    if (!gameStarted || !breedingUnlocked) return;

    const tick = setInterval(() => {
      setBananaPrice(prev => {
        const step = prev * 0.08;
        const meanPull = (BANANA_PRICE_BASE - prev) * 0.15;
        const change = (Math.random() * 2 - 1) * step + meanPull;
        const next = Math.max(BANANA_PRICE_MIN, Math.min(BANANA_PRICE_MAX, prev + change));
        bananaPriceRef.current = Math.round(next * 100) / 100;
        return bananaPriceRef.current;
      });

      // ~3% chance per tick (~once every 2.5 min) for banana boat (50% off, 20s)
      if (!bananaBoatRef.current && Math.random() < 0.03) {
        bananaBoatRef.current = true;
        setBananaBoat(true);
        playDing(2);
        addEvent('info', '🚢 BANANA BOAT ARRIVES! 50% off for 20s!');
        setPinnedAlert({ message: '🚢 BANANA BOAT: 50% off bananas — 20s remaining', type: 'info' });
        bananaBoatEndRef.current = setTimeout(() => {
          bananaBoatRef.current = false;
          setBananaBoat(false);
          setPinnedAlert(null);
          addEvent('info', '🚢 Banana boat has sailed.');
        }, 20000);
      }
    }, 5000);

    return () => {
      clearInterval(tick);
      if (bananaBoatEndRef.current) clearTimeout(bananaBoatEndRef.current);
    };
  }, [gameStarted, breedingUnlocked]);

  /* Typing ambience - scales with monkey count, silenced when dozing */
  useEffect(() => {
    const totalMonkeys = gameState.upgrades.monkeys;

    if (gameStarted && totalMonkeys > 0 && !dozing) {
      startTypingAmbience(totalMonkeys);
    } else {
      stopTypingAmbience();
    }

    return () => stopTypingAmbience();
  }, [gameState.upgrades.monkeys, gameStarted, dozing]);

  /* Main game loop: schedule gems, auto-sell words, breeding */
  useEffect(() => {
    const gameLoop = setInterval(() => {
      const currentTime = Date.now() - startTimeRef.current;
      const scheduler = schedulerRef.current;
      const totalMonkeys = gameState.upgrades.monkeys;

      // Check for breeding unlock at 8 monkeys
      if (!breedingUnlocked && totalMonkeys >= 8) {
        setBreedingUnlocked(true);
        // Gift 100 starter bananas so the player has time to learn the system
        dispatch({ type: ACTIONS.BUY_BANANAS, payload: { count: 100, cost: 0 } });
        addEvent('info', '⚠️ ALERT: Monkeys have started breeding — and they\'re hungry!');
        addEvent('info', 'Starter supply: 100 🍌 provided. Buy more to keep them typing.');
        setPinnedAlert({ message: '⚠️ BREEDING ALERT: monkeys are hungry — buy bananas', type: 'info' });

        setCurrentAlert({
          type: 'warning',
          icon: '🐵',
          title: 'Breeding Alert',
          message: 'The monkeys have reached critical mass and begun to reproduce.',
          details: 'Population will now grow automatically. They also need bananas to keep typing — buy more before they doze off.',
          onDismiss: () => {
            setCurrentAlert(null);
            setPinnedAlert(null);
          },
        });
      }

      // Check for Phase 2 transition at 10,000 monkeys
      if (gameState.phase === 1 && totalMonkeys >= 10000) {
        dispatch({ type: ACTIONS.SET_PHASE, payload: 2 });
        addEvent('critical', '🚨 CRITICAL MASS ACHIEVED');
        addEvent('info', 'Monkey output now 0.001% of global text production');
        addEvent('info', 'New objective: Dominate the textual sphere');

        setCurrentAlert({
          type: 'critical',
          icon: '⚠️',
          title: 'Critical Mass Achieved',
          message: 'The monkey population has reached 10,000. Their collective output is now measurable on a global scale.',
          details: 'New resource unlocked: INFLUENCE • New objective: Control the publishing industry'
        });
      }

      // Only run if we have monkeys
      if (totalMonkeys === 0) return;

      /* Check if we're in scripted phase.
         The scripted clock is anchored to the FIRST MONKEY PURCHASE, not
         session start, so players who read the screen first don't skip
         the 2s/4s/6s onboarding beats. */
      const scriptTime = scriptStartRef.current
        ? Date.now() - scriptStartRef.current
        : 0;
      if (scriptStartRef.current && isScriptedPhase(scriptTime)) {
        /* Latest gem whose time has PASSED (getNextScriptedGem returns the
           next FUTURE gem, which can never satisfy scriptTime >= gem.time —
           that comparator mismatch silently killed the whole sequence) */
        const scriptedGem = getCurrentScriptedGem(scriptTime);
        if (
          scriptedGem &&
          !lastHarvestTimeRef.current[scriptedGem.time]
        ) {
          lastHarvestTimeRef.current[scriptedGem.time] = true;
          playDing(scriptedGem.tier);

          /* Show the gem in the feed (multi-word phrases never occur
             naturally in the gibberish stream) */
          setInjectedGem({
            text: scriptedGem.text,
            tier: scriptedGem.tier,
            isNearMiss: scriptedGem.isNearMiss,
            id: scriptedGem.time,
          });

          if (scriptedGem.isNearMiss) {
            playNearMissSound();
            addEvent('info', `SO CLOSE: "${scriptedGem.text}"`);
          } else {
            dispatch({
              type: ACTIONS.HARVEST_WORD,
              payload: {
                text: scriptedGem.text,
                tier: scriptedGem.tier,
                count: 1,
              },
            });
            const phraseWordCount = scriptedGem.text.trim().split(/\s+/).length;
            if (phraseWordCount > 1) setComboCount(phraseWordCount);
            addEvent('discovery', phraseWordCount > 1
              ? `Discovered "${scriptedGem.text}" — ${phraseWordCount}x COMBO!`
              : `Discovered "${scriptedGem.text}"`);
          }
        }
      } else if (scriptStartRef.current) {
        /* Post-scripted phase (issue D): the gem scheduler drives visible
           discoveries. Previously scheduleNextGem was never called, so
           nextGemTime sat at its stale 2000ms seed and no scheduler gem ever
           fired or injected into the feed. */
        if (!scheduler.postScriptInit) {
          // One-time seed: schedule the first post-script gem instead of
          // firing one the instant the scripted window ends
          scheduler.postScriptInit = true;
          scheduleNextGem(scheduler, scriptTime, totalMonkeys, 0, false);
        } else if (scriptTime >= scheduler.nextGemTime) {
          const { tier } = scheduleNextGem(scheduler, scriptTime, totalMonkeys, 0, false);
          /* MIN_GEM_GAP_MS = 8000: scaleByMonkeys floors tier-1 intervals at
             ~0.5-1.5s at scale, which would pause the feed ~40% of the time
             (each injection pauses the stream 400ms) and add uncontrolled
             income. The 8s floor caps scheduler income at <= 7.5 words/min
             = <= $15/min — negligible vs the sim's $116+/min detection
             income from min 3, so it does not move the issue-A verdict. */
          scheduler.nextGemTime = Math.max(scheduler.nextGemTime, scriptTime + 8000);

          // Chaos stays 0 (trained) — the caffeination dial is Phase 2
          const text = pickGemText(tier, dictionaryRef.current);
          if (text) {
            playDing(Math.min(tier, 4));
            setInjectedGem({
              text,
              tier,
              isNearMiss: false,
              id: `sched-${Math.round(scriptTime)}`,
            });
            dispatch({
              type: ACTIONS.HARVEST_WORD,
              payload: { text, tier, count: 1 },
            });
            const phraseWordCount = text.trim().split(/\s+/).length;
            if (phraseWordCount > 1) setComboCount(phraseWordCount);
            addEvent(
              'discovery',
              tier >= 3
                ? `RARE FIND: "${text}"${phraseWordCount > 1 ? ` — ${phraseWordCount}x COMBO!` : ''}`
                : `Discovered "${text}"`
            );
          }
        }
      }

      /* Sales Monkey auto-clicks SELL button every 5 seconds */
      if (gameState.upgrades.salesMonkey > 0 && gameState.resources.words > 0) {
        const timeSinceLastSale = Date.now() - lastAutoSaleRef.current;
        if (timeSinceLastSale > 5000) { // Every 5 seconds
          handleSellWords();
          lastAutoSaleRef.current = Date.now();
        }
      }

      /* Banana consumption (active once breeding unlocks) */
      if (breedingUnlocked && totalMonkeys > 0) {
        bananaConsumeAccRef.current += getBananaConsumptionRate(totalMonkeys) * 0.1;
        const whole = Math.floor(bananaConsumeAccRef.current);
        if (whole > 0) {
          bananaConsumeAccRef.current -= whole;
          dispatch({ type: ACTIONS.CONSUME_BANANAS, payload: whole });
        }

        const isDozingNow = gameState.resources.bananas <= 0;
        if (isDozingNow !== dozingRef.current) {
          dozingRef.current = isDozingNow;
          setDozing(isDozingNow);
          if (isDozingNow) {
            addEvent('info', '🍌 Out of bananas — monkeys are dozing...');
          } else {
            addEvent('info', '🍌 Monkeys fed — back to work!');
            lastBananaWarnRef.current = 0; // reset so warning can fire again when low
          }
        }

        // Proactive banana-low warning: fire at most once per 120s when supply < 90s
        if (!isDozingNow && gameState.resources.bananas > 0) {
          const bananaSeconds = getBananaTimeRemaining(gameState.resources.bananas, totalMonkeys);
          const now = Date.now();
          if (bananaSeconds < 90 && now - lastBananaWarnRef.current > 120000) {
            lastBananaWarnRef.current = now;
            addEvent('info', '🍌 Bananas running low — troop gets restless in ~90s');
          }
        }
      }

      /* Breeding: monkeys naturally reproduce over time (unlocks at 8 monkeys) */
      const timeSinceLastBreeding = Date.now() - lastBreedingTimeRef.current;
      const habitatCount = gameState.upgrades.habitat || 0;

      // Base breeding interval: 60s (background trickle, not an exponential engine)
      const baseBreedingInterval = 60000;
      const numberOfPairs = Math.floor(totalMonkeys / 2);

      // Each pair doubles the reproduction rate (halves the interval)
      // Habitat upgrades add 10% rate boost per level
      const habitatRateBonus = 1 + (habitatCount * 0.1);
      const rateMultiplier = Math.max(1, numberOfPairs) * habitatRateBonus;
      const breedingInterval = Math.max(baseBreedingInterval / rateMultiplier, 8000); // Min 8s

      // Dozing monkeys don't breed
      if (breedingUnlocked && totalMonkeys >= 8 && timeSinceLastBreeding > breedingInterval && !dozingRef.current) {
        // Each habitat level adds 1 offspring per birth (level 0=1, level 1=2, etc.)
        const offspring = 1 + habitatCount;

        // Add bred offspring (doesn't affect purchase cost)
        dispatch({
          type: ACTIONS.ADD_BRED_MONKEY,
          payload: offspring,
        });

        bredSinceLastReportRef.current += offspring;
        lastBreedingTimeRef.current = Date.now();
      }

      /* Batch breeding announcements: one StatusBox line per minute so
         birth spam doesn't push discoveries out of the 3-line log */
      if (
        bredSinceLastReportRef.current > 0 &&
        Date.now() - lastBreedReportRef.current > 60000
      ) {
        const born = bredSinceLastReportRef.current;
        addEvent('breeding', `${born} monkey${born > 1 ? 's' : ''} born`);
        bredSinceLastReportRef.current = 0;
        lastBreedReportRef.current = Date.now();
      }

      /* Calculate text share in Phase 2 */
      if (gameState.phase === 2) {
        // Human baseline: 1 trillion words per day
        const humanBaseline = 1e12;
        // Monkey output: monkeys × efficiency × words per day
        const wordsPerMinute = totalMonkeys * 10; // Rough estimate
        const monkeyOutputPerDay = wordsPerMinute * 1440;
        // Calculate share
        const textShare = (monkeyOutputPerDay / (humanBaseline + monkeyOutputPerDay)) * 100;

        dispatch({
          type: ACTIONS.UPDATE_TEXT_SHARE,
          payload: textShare
        });

        // Marketing Budget milestones
        const milestones = [
          { threshold: 0.001, reward: 100000, label: '0.001%' },
          { threshold: 0.01, reward: 1000000, label: '0.01%' },
          { threshold: 0.1, reward: 10000000, label: '0.1%' },
          { threshold: 1, reward: 100000000, label: '1%' },
          { threshold: 5, reward: 500000000, label: '5%' },
          { threshold: 10, reward: 1000000000, label: '10%' },
          { threshold: 25, reward: 5000000000, label: '25%' },
          { threshold: 50, reward: 10000000000, label: '50%' },
          { threshold: 75, reward: 50000000000, label: '75%' },
        ];

        for (const milestone of milestones) {
          if (textShare >= milestone.threshold && lastMarketingMilestone < milestone.threshold) {
            dispatch({
              type: ACTIONS.ADD_MARKETING_BUDGET,
              payload: milestone.reward
            });
            setLastMarketingMilestone(milestone.threshold);
            addEvent('info', `Marketing Budget +$${(milestone.reward / 1000000).toFixed(0)}M (${milestone.label} share)`);
            break;
          }
        }
      }
    }, 100); // Game loop: 100ms tick

    return () => clearInterval(gameLoop);
  }, [gameState, dispatch]);

  /* Fixed-timestep word-detection income (issue C): a wall-clock accumulator
     independent of Feed's render-coupled generator tick. Elapsed time is
     UNCAPPED, so background timer clamping (250ms ticks stretching to 1s+)
     credits identical income to foreground — income never depends on render
     throughput. Rate comes from getDetectionsPerSecond (single source of
     truth, mirrored by sim/balance_sim.js). */
  useEffect(() => {
    if (!gameStarted) return;

    const detectionLoop = setInterval(() => {
      const now = Date.now();
      const { monkeys, caffeine, wordCounter } = liveStateRef.current;

      if (monkeys === 0) {
        lastDetectionTickRef.current = now;
        detectionAccRef.current = 0;
        return;
      }

      if (lastDetectionTickRef.current == null) {
        lastDetectionTickRef.current = now;
      }
      const elapsedSec = (now - lastDetectionTickRef.current) / 1000;
      lastDetectionTickRef.current = now;

      detectionAccRef.current +=
        getDetectionsPerSecond(monkeys, caffeine, wordCounter) * elapsedSec;

      let whole = Math.floor(detectionAccRef.current);
      detectionAccRef.current -= whole;

      if (whole === 0 || dictionaryRef.current.length === 0) return;

      /* Up to 3 detections go through the full path (5s dedup, tier from
         dictionary index, ding, StatusBox event, HARVEST_WORD dispatch) */
      const dict = dictionaryRef.current;
      const fullPath = Math.min(whole, 3);
      for (let i = 0; i < fullPath; i++) {
        handleWordDetected(dict[Math.floor(Math.random() * dict.length)]);
      }

      /* Catch-up bursts / high monkey counts: credit the remainder in one
         batched dispatch — zero income loss, no audio/log spam */
      if (whole > 3) {
        const remainder = whole - 3;
        dispatch({
          type: ACTIONS.HARVEST_WORD,
          payload: {
            text: dict[Math.floor(Math.random() * dict.length)],
            tier: 1,
            count: remainder,
          },
        });
        addEvent('discovery', `Detected ${remainder} more words`);
      }
    }, 250);

    return () => clearInterval(detectionLoop);
  }, [gameStarted]);

  /* Stable callback (refs only, no state reads): Feed's generator interval
     lists this in its effect deps, so a new identity every render tears the
     interval down constantly and deflates income with render cost */
  const handleWordDetected = useCallback((word) => {
    const now = Date.now();

    // Skip words harvested within the last 5 seconds
    const lastHarvest = recentHarvestsRef.current.get(word.toLowerCase());
    if (lastHarvest && now - lastHarvest < 5000) return;
    recentHarvestsRef.current.set(word.toLowerCase(), now);

    // Determine tier based on word commonness in dictionary
    const wordIndex = dictionaryRef.current.indexOf(word);
    let tier = 1;
    if (wordIndex > 3000) tier = 3;
    else if (wordIndex > 1000) tier = 2;

    playDing(tier);

    dispatch({
      type: ACTIONS.HARVEST_WORD,
      payload: { text: word, tier: tier, count: 1 },
    });

    addEvent('discovery', `Discovered "${word}"`);
  }, []);

  const handleSellWords = () => {
    if (gameState.resources.words > 0) {
      dispatch({ type: ACTIONS.SELL_WORDS });
      playSellSound();
    }
  };

  const handleBuyBananas = () => {
    const effectivePrice = bananaBoat ? bananaPrice * 0.5 : bananaPrice;
    const totalCost = Math.round(effectivePrice * BANANA_BUY_COUNT * 100) / 100;
    if (gameState.resources.money >= totalCost) {
      dispatch({ type: ACTIONS.BUY_BANANAS, payload: { count: BANANA_BUY_COUNT, cost: totalCost } });
      addEvent('purchase', `Bought ${BANANA_BUY_COUNT} 🍌 for $${totalCost.toFixed(2)}`);
    }
  };

  const handleUpgradeBuy = (upgradeKey) => {
    const currentCount = upgradeKey === 'monkeys' ? (gameState.costBasis.monkeys || 0) : (gameState.upgrades[upgradeKey] || 0);
    const cost = getNextCost(upgradeKey, currentCount);

    if (gameState.resources.money >= cost) {
      /* Reset scheduler if buying first monkey (to restart scripted sequence).
         Anchor the scripted 0-35s clock to this moment. */
      if (upgradeKey === 'monkeys' && currentCount === 0) {
        schedulerRef.current.nextGemTime = 2000;
        lastHarvestTimeRef.current = {};
        scriptStartRef.current = Date.now();
        addEvent('info', 'Research project initiated...');
      }

      dispatch({
        type: ACTIONS.BUY_UPGRADE,
        payload: { upgradeKey, cost },
      });

      addEvent('purchase', `Purchased ${UPGRADE_CONFIGS[upgradeKey].name}`);
    }
  };

  const upgradesToShow = Object.keys(UPGRADE_CONFIGS).filter(key => {
    // Habitat only shows after breeding unlocks
    if (key === 'habitat') {
      return breedingUnlocked;
    }
    // Caffeine hidden until the first monkey: exactly one lit button at t=0
    if (key === 'caffeine') {
      return gameState.upgrades.monkeys >= 1;
    }
    // Sales monkey is available after 5 minutes or once it's a plausible save-up goal
    if (key === 'salesMonkey') {
      // Hide if already purchased
      if (gameState.upgrades.salesMonkey > 0) return false;
      return gameState.resources.money >= 500 || Date.now() - startTimeRef.current > 300000;
    }
    // Word Counter appears after caffeine is purchased or after 90s of play
    if (key === 'wordCounter') {
      return gameState.upgrades.caffeine >= 1 || Date.now() - startTimeRef.current > 90000;
    }
    return true;
  });

  return (
    <div className="game-container">
      {currentAlert && (
        <AlertModal
          alert={currentAlert}
          onDismiss={() => {
            if (currentAlert.onDismiss) {
              currentAlert.onDismiss();
            } else {
              setCurrentAlert(null);
            }
          }}
        />
      )}
      {showIndicator && (
        <EngineIndicator
          gameStarted={gameStarted}
          totalMonkeys={gameState.upgrades.monkeys}
          wordsDiscovered={gameState.anthology.words.length}
          elapsedSeconds={elapsedSeconds}
        />
      )}
      {!gameStarted ? (
        <StartScreen onStart={() => setGameStarted(true)} />
      ) : (
        <>
          <div className="game-header">
            <h1>{gameState.phase === 2 ? 'MILLION MONKEYS DOMINION PROJECT' : 'MILLION MONKEYS RESEARCH PROJECT'}</h1>
          </div>
          <div className="game-layout">
        {/* Feed or Sector Chart based on phase */}
        {gameState.phase === 1 ? (
          <Feed
            gameState={gameState}
            startTime={startTimeRef.current}
            totalMonkeys={gameState.upgrades.monkeys}
            injectedGem={injectedGem}
            dozing={dozing}
          />
        ) : (
          <SectorChart
            textShare={gameState.ui.earthTextShare}
            sectorsControlled={gameState.ui.sectorsControlled}
            totalMonkeys={gameState.upgrades.monkeys}
          />
        )}

        {/* Status Box */}
        <StatusBox events={events} pinnedAlert={pinnedAlert} />

        {/* Stats */}
        <Stats gameState={gameState} bananasVisible={breedingUnlocked} />

        {/* Sell button + Economy buttons */}
        <div className="economy">
          <button
            className={`sell-button ${gameState.resources.words > 0 ? 'active' : ''} ${gameState.upgrades.salesMonkey > 0 ? 'automated' : ''} ${gameState.resources.words >= 5 && gameState.upgrades.salesMonkey === 0 ? 'nudge' : ''}`}
            onClick={handleSellWords}
            disabled={gameState.resources.words === 0}
          >
            <span className="sell-label">{gameState.upgrades.salesMonkey > 0 ? 'AUTO-SELL' : 'SELL'}</span>
            <span className="sell-count">{gameState.resources.words} words</span>
            <span className="sell-earnings">+${gameState.resources.words * DOLLARS_PER_WORD}</span>
          </button>

          {breedingUnlocked && (() => {
            const effectivePrice = bananaBoat ? bananaPrice * 0.5 : bananaPrice;
            const totalCost = Math.round(effectivePrice * BANANA_BUY_COUNT * 100) / 100;
            const canAffordBananas = gameState.resources.money >= totalCost;
            return (
              <button
                className={`banana-button${bananaBoat ? ' boat-active' : ''}`}
                onClick={handleBuyBananas}
                disabled={!canAffordBananas}
                title={`Buy ${BANANA_BUY_COUNT} bananas — $${totalCost.toFixed(2)}`}
              >
                {bananaBoat && <span className="banana-boat-tag">🚢 50% OFF</span>}
                <span className="banana-label">Buy 100 🍌</span>
                <span className="banana-price">${totalCost.toFixed(2)}</span>
              </button>
            );
          })()}

          {upgradesToShow.map((upgradeKey) => {
            const currentCount = upgradeKey === 'monkeys' ? (gameState.costBasis.monkeys || 0) : (gameState.upgrades[upgradeKey] || 0);
            const cost = getNextCost(upgradeKey, currentCount);

            return (
              <UpgradeButton
                key={upgradeKey}
                upgradeKey={upgradeKey}
                upgradeName={UPGRADE_CONFIGS[upgradeKey].name}
                cost={cost}
                canAfford={gameState.resources.money >= cost}
                money={gameState.resources.money}
                pulse={upgradeKey === 'monkeys' && gameState.upgrades.monkeys === 0}
                onClick={() => handleUpgradeBuy(upgradeKey)}
                showCount={true}
                upgradeCount={currentCount}
              />
            );
          })}
        </div>
          </div>
        </>
      )}
    </div>
  );
}
