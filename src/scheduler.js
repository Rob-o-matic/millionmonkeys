/* Gem scheduler: determines what word appears when */

const GEM_TIERS = {
  1: { baseMin: 1000, baseMax: 3000, pity: 15000, name: 'word' },
  2: { baseMin: 12000, baseMax: 25000, pity: 180000, name: 'long word' },
  3: { baseMin: 60000, baseMax: 120000, pity: 720000, name: 'phrase' },
  4: { baseMin: 600000, baseMax: 1200000, pity: 86400000, name: 'anomaly' }, // 24h pity in ms
  5: { baseMin: Infinity, baseMax: Infinity, pity: Infinity, name: 'Shakespeare' },
};

/* Act 1 cadence ceiling: rarity comes from selectTier's weights, but the
   GAP to the next gem never exceeds 45s (the documented tier-2 "every
   20-40s" cadence). Without this, awarding a tier-3/4 gem silenced ALL
   visible discoveries for that tier's own 60s-20min interval. */
export const MAX_GEM_INTERVAL_MS = 45000;

/* Scale interval based on monkey count (50% floor) */
export function scaleByMonkeys(interval, monkeyCount) {
  const scaled = interval / monkeyCount;
  const floor = interval * 0.5;
  return Math.max(scaled, floor);
}

/* 5-stop caffeination dial — each stop blends gem-tier probabilities.
   Decaf = safe common words; The Jitters = risky rare anomalies. */
export const CAFFEINE_DIAL_STOPS = [
  { label: 'Decaf',       weights: [0.83, 0.15, 0.02, 0.00] },
  { label: 'Mild',        weights: [0.68, 0.23, 0.08, 0.01] },
  { label: 'Regular',     weights: [0.50, 0.35, 0.12, 0.03] },
  { label: 'Strong',      weights: [0.40, 0.28, 0.23, 0.09] },
  { label: 'The Jitters', weights: [0.25, 0.26, 0.32, 0.17] },
];

/* Get next gem tier using a weight array [tier1, tier2, tier3, tier4] */
function selectTier(weights) {
  const roll = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) return i + 1;
  }
  // Fallback to last tier if floating-point rounding leaves a gap
  return weights.length;
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
  tierWeights = CAFFEINE_DIAL_STOPS[2].weights,
  isScripted = false
) {
  let tier = selectTier(tierWeights);

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
    // Cap the gap: rare tiers stay rare by weight, not by drought
    interval = Math.min(interval, MAX_GEM_INTERVAL_MS);
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
