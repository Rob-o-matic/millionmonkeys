/* Money economy: upgrades cost money (from selling words) */

const UPGRADE_CONFIGS = {
  monkeys: { baseCost: 30, costMult: 1.25, name: 'Monkey' },
  habitat: { baseCost: 500, costMult: 1.15, name: 'Upgrade Habitat' },
  caffeine: { baseCost: 60, costMult: 2.0, name: 'Coffee Maker' },
  salesMonkey: { baseCost: 2000, costMult: 1.15, name: 'Sales Monkey' },
  wordCounter: { baseCost: 350, costMult: 1.15, name: 'Word Counter' },
};

const DOLLARS_PER_WORD = 2; // $2 per word when sold

export const BANANA_PRICE_BASE = 0.10;
export const BANANA_PRICE_MIN  = 0.05;
export const BANANA_PRICE_MAX  = 0.18;
export const BANANA_BUY_COUNT  = 20;

/* Calculate cost for the Nth purchase in a track (0-indexed) */
export function getCost(upgradeKey, purchaseCount) {
  const config = UPGRADE_CONFIGS[upgradeKey];
  if (!config) return Infinity;

  return Math.round(config.baseCost * Math.pow(config.costMult, purchaseCount));
}

/* Get next cost (for current count) */
export function getNextCost(upgradeKey, currentCount) {
  return getCost(upgradeKey, currentCount);
}

/* Can afford upgrade? */
export function canAfford(money, upgradeKey, currentCount) {
  return money >= getNextCost(upgradeKey, currentCount);
}

/* Calculate breeding bonuses from habitat upgrades */
export function getBreedingBonuses(habitatCount) {
  // Each habitat upgrade reduces breeding interval by 10%
  const intervalMultiplier = Math.pow(0.9, habitatCount);
  const intervalReduction = 15000 * (1 - intervalMultiplier);

  // Each habitat upgrade increases offspring by 10%
  const offspringMultiplier = 1 + (habitatCount * 0.1);

  return { intervalReduction, offspringMultiplier };
}

/* Nominal word-detection rate (detections per second).
   Single source of truth for income rate — mirrors Feed.jsx's visual tick
   model exactly, but income is computed here (fixed-timestep accumulator in
   App.jsx) so it never depends on render throughput or timer throttling.
   For M < 10 this reduces to 0.25 * M * 1.1^caffeine detections/sec
   (= $0.50 * M * 1.1^c per sec at $2/word). */
export function getDetectionsPerSecond(totalMonkeys, caffeineCount, wordCounterLevel = 0) {
  if (totalMonkeys <= 0) return 0;

  const baseInterval = 40;
  let scaledInterval;
  if (totalMonkeys < 10) {
    scaledInterval = baseInterval / totalMonkeys;
  } else if (totalMonkeys < 100) {
    scaledInterval = baseInterval / (totalMonkeys * 2);
  } else if (totalMonkeys < 1000) {
    scaledInterval = baseInterval / (totalMonkeys * 5);
  } else {
    scaledInterval = baseInterval / (totalMonkeys * 10);
  }
  scaledInterval = Math.max(scaledInterval, 1);

  const ticksPerSec = 1000 / scaledInterval;
  const detectChance = Math.min(
    1,
    0.10 * ((scaledInterval * totalMonkeys) / 40) * Math.pow(1.1, caffeineCount)
  );

  // 10% of ticks emit a real word; each has detectChance to be harvested
  return ticksPerSec * 0.10 * detectChance * (1 + 0.05 * wordCounterLevel);
}

/* Calculate total monkeys (active producers) */
export function getTotalMonkeys(upgrades) {
  return upgrades.monkeys;
}

/* Production bonus from upgrades */
export function getProductionMultiplier(upgrades) {
  let mult = 1;
  // Caffeine: 1.1x per tier
  mult *= Math.pow(1.1, upgrades.caffeine);
  return mult;
}

/* Banana consumption rate (bananas/second). Sublinear to keep cost/income
   curves from crossing as population scales. */
export function getBananaConsumptionRate(totalMonkeys) {
  if (totalMonkeys <= 0) return 0;
  return Math.pow(totalMonkeys, 0.8) / 15;
}

/* Seconds of banana supply remaining */
export function getBananaTimeRemaining(bananas, totalMonkeys) {
  const rate = getBananaConsumptionRate(totalMonkeys);
  if (rate <= 0) return Infinity;
  return bananas / rate;
}

export { UPGRADE_CONFIGS, DOLLARS_PER_WORD };
