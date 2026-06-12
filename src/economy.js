/* Money economy: upgrades cost money (from selling words) */

const UPGRADE_CONFIGS = {
  monkeys: { baseCost: 30, name: 'Monkey' },
  habitat: { baseCost: 500, name: 'Upgrade Habitat' },
  caffeine: { baseCost: 60, name: 'Caffeine' },
  salesMonkey: { baseCost: 2000, name: 'Sales Monkey' },
};

const COST_MULTIPLIER = 1.15;
const WORDS_PER_DOLLAR = 10; // $10 per word when sold

/* Calculate cost for the Nth purchase in a track (0-indexed) */
export function getCost(upgradeKey, purchaseCount) {
  const config = UPGRADE_CONFIGS[upgradeKey];
  if (!config) return Infinity;

  return Math.round(config.baseCost * Math.pow(COST_MULTIPLIER, purchaseCount));
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

/* Calculate auto-sale rate (words/second converted to money by sales monkeys) */
export function getAutoSaleRate(upgrades) {
  // Each sales monkey auto-sells 0.1 words per second
  return upgrades.salesMonkey * 0.1;
}

export { UPGRADE_CONFIGS, WORDS_PER_DOLLAR };
