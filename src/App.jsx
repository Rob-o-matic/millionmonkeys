import React, { useReducer, useEffect, useRef, useState } from 'react';
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
import { getNextCost, canAfford as canAffordUpgrade, getBreedingBonuses, UPGRADE_CONFIGS, DOLLARS_PER_WORD } from './economy';
import { playDing, playNearMissSound, playSellSound, resumeAudioContext, startTypingAmbience, stopTypingAmbience } from './audio';
import {
  isScriptedPhase,
  getNextScriptedGem,
} from './scripting';
import './App.css';

export function App() {
  const [gameState, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [gameStarted, setGameStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const [events, setEvents] = useState([]);
  const [dictionary, setDictionary] = useState([]);
  const [comboCount, setComboCount] = useState(0);
  const [breedingUnlocked, setBreedingUnlocked] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [lastMarketingMilestone, setLastMarketingMilestone] = useState(0);
  const [injectedGem, setInjectedGem] = useState(null);
  const schedulerRef = useRef(createScheduler());
  const startTimeRef = useRef(Date.now());
  const scriptStartRef = useRef(null);
  const lastHarvestTimeRef = useRef({});
  const lastAutoSaleRef = useRef(Date.now());
  const lastBreedingTimeRef = useRef(Date.now());
  const lastWordDetectionRef = useRef(0);
  const bredSinceLastReportRef = useRef(0);
  const lastBreedReportRef = useRef(Date.now());

  /* Load dictionary on mount */
  useEffect(() => {
    fetch('/words.txt')
      .then(res => res.text())
      .then(text => {
        const words = text.trim().split('\n').filter(w => w.length > 0);
        setDictionary(words);
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

  /* Apply token drift on state change (tied to population milestones) */
  useEffect(() => {
    // Calculate drift based on monkey population
    const totalMonkeys = gameState.upgrades.monkeys;

    let drift = 0;
    if (totalMonkeys >= 100) drift = 0.25; // Subtle shift at 100
    if (totalMonkeys >= 250) drift = 0.5;  // Noticeable at 250
    if (totalMonkeys >= 500) drift = 0.75; // Dramatic at 500
    if (totalMonkeys >= 1000) drift = 1.0; // Full takeover at 1000

    if (drift !== gameState.driftProgress) {
      dispatch({
        type: ACTIONS.SET_DRIFT,
        payload: drift,
      });
    }

    applyTokens(drift);
  }, [gameState.upgrades.monkeys, gameState.driftProgress, dispatch]);

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

  /* Typing ambience - scales with monkey count */
  useEffect(() => {
    const totalMonkeys = gameState.upgrades.monkeys;

    if (gameStarted && totalMonkeys > 0) {
      startTypingAmbience(totalMonkeys);
    } else {
      stopTypingAmbience();
    }

    return () => stopTypingAmbience();
  }, [gameState.upgrades.monkeys, gameStarted]);

  /* Main game loop: schedule gems, auto-sell words, breeding */
  useEffect(() => {
    const gameLoop = setInterval(() => {
      const currentTime = Date.now() - startTimeRef.current;
      const scheduler = schedulerRef.current;
      const totalMonkeys = gameState.upgrades.monkeys;

      // Check for breeding unlock at 8 monkeys
      if (!breedingUnlocked && totalMonkeys >= 8) {
        setBreedingUnlocked(true);
        addEvent('info', '⚠️ ALERT: Monkeys have started breeding!');
        addEvent('info', 'Population will now grow automatically...');

        setCurrentAlert({
          type: 'warning',
          icon: '🐵',
          title: 'Breeding Alert',
          message: 'The monkeys have reached critical mass and begun to reproduce.',
          details: 'Population growth is now automatic and exponential.'
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
        const scriptedGem = getNextScriptedGem(scriptTime);
        if (
          scriptedGem &&
          !lastHarvestTimeRef.current[scriptedGem.time] &&
          scriptTime >= scriptedGem.time
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
            addEvent('discovery', `Discovered "${scriptedGem.text}"`);
          }
        }
      }
      // After scripting, real-time word detection takes over (handled by Feed component)

      /* Sales Monkey auto-clicks SELL button every 5 seconds */
      if (gameState.upgrades.salesMonkey > 0 && gameState.resources.words > 0) {
        const timeSinceLastSale = Date.now() - lastAutoSaleRef.current;
        if (timeSinceLastSale > 5000) { // Every 5 seconds
          handleSellWords();
          lastAutoSaleRef.current = Date.now();
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
      const breedingInterval = Math.max(baseBreedingInterval / rateMultiplier, 15000); // Min 15s (~4 births/min cap)

      if (breedingUnlocked && totalMonkeys >= 8 && timeSinceLastBreeding > breedingInterval) {
        // Habitat upgrades also increase offspring count by 10% per level
        const habitatOffspringBonus = 1 + (habitatCount * 0.1);
        const offspring = Math.max(1, Math.floor(1 * habitatOffspringBonus));

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

  const handleWordDetected = (word) => {
    // Check if we've already harvested this word recently
    const alreadyHarvested = gameState.anthology.words.some(
      w => w.text.toLowerCase() === word.toLowerCase() &&
      Date.now() - w.timestamp < 5000 // Within last 5 seconds
    );

    if (!alreadyHarvested) {
      // Determine tier based on word commonness in dictionary
      const wordIndex = dictionary.indexOf(word);
      let tier = 1;
      if (wordIndex > 3000) tier = 3;
      else if (wordIndex > 1000) tier = 2;

      // Check for combo (word detected within 800ms of last - genuinely rare bursts)
      const timeSinceLastWord = Date.now() - lastWordDetectionRef.current;
      let newComboCount = 0;

      if (timeSinceLastWord < 800 && lastWordDetectionRef.current > 0) {
        // Continue combo
        newComboCount = comboCount + 1;
        setComboCount(newComboCount);
      } else {
        // Reset combo
        newComboCount = 1;
        setComboCount(1);
      }

      lastWordDetectionRef.current = Date.now();

      playDing(tier);

      dispatch({
        type: ACTIONS.HARVEST_WORD,
        payload: {
          text: word,
          tier: tier,
          count: 1,
        },
      });

      // Combo is celebration only - no bonus-word income
      if (newComboCount >= 2) {
        addEvent('discovery', `"${word}" - ${newComboCount}x COMBO!`);
      } else {
        addEvent('discovery', `Discovered "${word}"`);
      }
    }
  };

  const handleSellWords = () => {
    if (gameState.resources.words > 0) {
      dispatch({ type: ACTIONS.SELL_WORDS });
      playSellSound();
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
    return true;
  });

  return (
    <div className="game-container">
      {currentAlert && (
        <AlertModal
          alert={currentAlert}
          onDismiss={() => setCurrentAlert(null)}
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
            onWordGenerated={handleWordDetected}
            caffeineCount={gameState.upgrades.caffeine}
            injectedGem={injectedGem}
          />
        ) : (
          <SectorChart
            textShare={gameState.ui.earthTextShare}
            sectorsControlled={gameState.ui.sectorsControlled}
            totalMonkeys={gameState.upgrades.monkeys}
          />
        )}

        {/* Status Box */}
        <StatusBox events={events} />

        {/* Stats */}
        <Stats gameState={gameState} />

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
