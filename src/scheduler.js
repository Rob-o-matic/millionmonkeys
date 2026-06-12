/* Gem scheduler: determines what word appears when */

const GEM_TIERS = {
  1: { baseMin: 1000, baseMax: 3000, pity: 15000, name: 'word' },
  2: { baseMin: 12000, baseMax: 25000, pity: 180000, name: 'long word' },
  3: { baseMin: 60000, baseMax: 120000, pity: 720000, name: 'phrase' },
  4: { baseMin: 600000, baseMax: 1200000, pity: 86400000, name: 'anomaly' }, // 24h pity in ms
  5: { baseMin: Infinity, baseMax: Infinity, pity: Infinity, name: 'Shakespeare' },
};

/* Scale interval based on monkey count (50% floor) */
export function scaleByMonkeys(interval, monkeyCount) {
  const scaled = interval / monkeyCount;
  const floor = interval * 0.5;
  return Math.max(scaled, floor);
}

/* Get next gem tier (probability-weighted after scripting) */
function selectTier(chaos = 0) {
  // chaos: 0 = trained, 1 = chaotic
  // Trained: Tier 1–3 fast, Tier 4 slow
  // Chaotic: reverse
  if (chaos < 0.5) {
    // Trained: 50% T1, 35% T2, 12% T3, 3% T4
    const roll = Math.random();
    if (roll < 0.5) return 1;
    if (roll < 0.85) return 2;
    if (roll < 0.97) return 3;
    return 4;
  } else {
    // Chaotic: 3% T1, 12% T2, 35% T3, 50% T4
    const roll = Math.random();
    if (roll < 0.03) return 1;
    if (roll < 0.15) return 2;
    if (roll < 0.5) return 3;
    return 4;
  }
}

/* Create a scheduler instance */
export function createScheduler() {
  return {
    nextGemTime: 0,
    pityTimers: { 1: 0, 2: 0, 3: 0, 4: 0 },
    lastGemTier: null,
  };
}

/* Schedule the next gem */
export function scheduleNextGem(
  scheduler,
  currentTime,
  monkeyCount = 1,
  chaos = 0,
  isScripted = false
) {
  let tier = selectTier(chaos);

  // Check pity timers
  Object.keys(GEM_TIERS).forEach((t) => {
    t = parseInt(t);
    if (t === 5) return; // Skip Shakespeare tier
    if (currentTime - scheduler.pityTimers[t] > GEM_TIERS[t].pity) {
      // Pity triggered: force this tier
      tier = t;
      scheduler.pityTimers[t] = currentTime;
    }
  });

  const tierConfig = GEM_TIERS[tier];
  let interval;

  if (!isScripted) {
    // Random interval within range, scaled by monkeys
    interval =
      scaleByMonkeys(
        tierConfig.baseMin +
          Math.random() * (tierConfig.baseMax - tierConfig.baseMin),
        monkeyCount
      );
  } else {
    interval = tierConfig.baseMin; // Use base for scripted
  }

  scheduler.nextGemTime = currentTime + interval;
  scheduler.lastGemTier = tier;
  scheduler.pityTimers[tier] = currentTime; // Reset pity for this tier

  return {
    tier,
    delay: interval,
    nextTime: scheduler.nextGemTime,
  };
}

/* Check if pity is active for a tier */
export function isPityActive(scheduler, tier, currentTime) {
  const tierConfig = GEM_TIERS[tier];
  if (!tierConfig) return false;
  return currentTime - scheduler.pityTimers[tier] > tierConfig.pity * 0.8;
}

/* Get grace window for a tier (how long it stays highlighted) */
export function getGraceWindow(tier) {
  const graceMap = { 1: 3000, 2: 4000, 3: 6000, 4: 8000, 5: Infinity };
  return graceMap[tier] || 3000;
}

/* Get base interval for testing */
export function getBaseInterval(tier) {
  return GEM_TIERS[tier]?.baseMin || 0;
}
