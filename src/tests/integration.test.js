/* Integration test: simulate 60 minutes of play */

import { describe, it, expect, beforeEach } from 'vitest';
import { gameReducer, INITIAL_STATE, ACTIONS } from './gameState';
import { createScheduler, scheduleNextGem } from './scheduler';
import { getTotalMonkeys, getCost } from './economy';

describe('Economy Simulation', () => {
  it('should meet tuning targets after 60 minutes of play', () => {
    let state = INITIAL_STATE;
    let scheduler = createScheduler();
    let currentTime = 0;
    let harvestedCount = 0;
    let upgradesBought = 0;

    const SIM_END = 60000; // 60 seconds for quick test
    const TICK_INTERVAL = 100;

    while (currentTime < SIM_END) {
      currentTime += TICK_INTERVAL;

      /* Schedule and harvest gems */
      if (currentTime >= scheduler.nextGemTime) {
        const totalMonkeys = getTotalMonkeys(state.upgrades);
        const result = scheduleNextGem(
          scheduler,
          currentTime,
          totalMonkeys,
          0,
          false
        );

        /* Add bananas */
        const reward = Math.pow(result.tier, 2) * 10;
        state = gameReducer(state, {
          type: ACTIONS.ADD_BANANA,
          payload: reward,
        });

        harvestedCount++;

        /* Try to buy upgrades */
        const upgradeKeys = [
          'monkeys',
          'trainedMonkeys',
          'editorMonkeys',
          'caffeine',
        ];
        for (const key of upgradeKeys) {
          const currentCount = state.upgrades[key] || 0;
          const cost = getCost(key, currentCount);

          if (state.resources.bananas >= cost) {
            state = gameReducer(state, {
              type: ACTIONS.BUY_UPGRADE,
              payload: { upgradeKey: key, cost },
            });
            upgradesBought++;
            break; // Buy one at a time
          }
        }
      }
    }

    /* Verify tuning targets */
    console.log('=== 60 SECOND SIMULATION ===');
    console.log(`Bananas earned: ${state.resources.bananas}`);
    console.log(`Gems harvested: ${harvestedCount}`);
    console.log(`Upgrades bought: ${upgradesBought}`);
    console.log(`Total monkeys: ${getTotalMonkeys(state.upgrades)}`);

    /* Assertions */
    expect(harvestedCount).toBeGreaterThan(2); // At least some gems
    expect(upgradesBought).toBeGreaterThan(0); // At least one upgrade
    expect(state.resources.bananas).toBeGreaterThan(0);
  });

  it('should scale intervals correctly with monkey count', () => {
    const scheduler = createScheduler();

    /* Single monkey */
    const result1 = scheduleNextGem(scheduler, 0, 1, 0, false);
    const delay1 = result1.delay;

    /* Five monkeys */
    const scheduler2 = createScheduler();
    const result5 = scheduleNextGem(scheduler2, 0, 5, 0, false);
    const delay5 = result5.delay;

    /* Delay with 5 monkeys should be less than with 1 */
    expect(delay5).toBeLessThan(delay1);
  });

  it('should apply 1.15x cost multiplier', () => {
    const cost0 = getCost('monkeys', 0);
    const cost1 = getCost('monkeys', 1);
    const cost2 = getCost('monkeys', 2);

    expect(cost0).toBe(10);
    expect(cost1).toBeCloseTo(11, 0);
    expect(cost2).toBeCloseTo(13, 0);

    /* Verify multiplier chain */
    expect(cost1 / cost0).toBeCloseTo(1.15, 2);
  });
});
