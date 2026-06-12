/* Integration test: simulate early play against the gem scheduler */

import { describe, it, expect } from 'vitest';
import { gameReducer, INITIAL_STATE, ACTIONS } from '../gameState';
import { createScheduler, scheduleNextGem, scaleByMonkeys } from '../scheduler';
import { getTotalMonkeys, getCost, DOLLARS_PER_WORD } from '../economy';

describe('Economy Simulation', () => {
  it('should harvest gems and afford upgrades over 60 simulated seconds', () => {
    let state = INITIAL_STATE;
    let scheduler = createScheduler();
    let currentTime = 0;
    let harvestedCount = 0;
    let upgradesBought = 0;

    const SIM_END = 60000; // 60 seconds for quick test
    const TICK_INTERVAL = 100;

    /* First action: buy a monkey with starting money */
    const firstCost = getCost('monkeys', 0);
    expect(state.resources.money).toBeGreaterThanOrEqual(firstCost);
    state = gameReducer(state, {
      type: ACTIONS.BUY_UPGRADE,
      payload: { upgradeKey: 'monkeys', cost: firstCost },
    });
    upgradesBought++;

    while (currentTime < SIM_END) {
      currentTime += TICK_INTERVAL;

      /* Schedule and harvest gems */
      if (currentTime >= scheduler.nextGemTime) {
        const totalMonkeys = getTotalMonkeys(state.upgrades);
        scheduleNextGem(scheduler, currentTime, totalMonkeys, 0, false);

        /* Harvest one word, then sell inventory */
        state = gameReducer(state, {
          type: ACTIONS.HARVEST_WORD,
          payload: { text: 'word', tier: 1, count: 1 },
        });
        state = gameReducer(state, { type: ACTIONS.SELL_WORDS });
        harvestedCount++;

        /* Try to buy a monkey */
        const currentCount = state.costBasis.monkeys || 0;
        const cost = getCost('monkeys', currentCount);
        if (state.resources.money >= cost) {
          state = gameReducer(state, {
            type: ACTIONS.BUY_UPGRADE,
            payload: { upgradeKey: 'monkeys', cost },
          });
          upgradesBought++;
        }
      }
    }

    /* Assertions */
    expect(harvestedCount).toBeGreaterThan(2); // At least some gems
    expect(upgradesBought).toBeGreaterThan(0); // At least one upgrade
    expect(getTotalMonkeys(state.upgrades)).toBeGreaterThanOrEqual(1);
  });

  it('should convert words to money at DOLLARS_PER_WORD on sell', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: ACTIONS.HARVEST_WORD,
      payload: { text: 'the', tier: 1, count: 5 },
    });
    const moneyBefore = state.resources.money;
    state = gameReducer(state, { type: ACTIONS.SELL_WORDS });

    expect(state.resources.words).toBe(0);
    expect(state.resources.money).toBe(moneyBefore + 5 * DOLLARS_PER_WORD);
  });

  it('should scale intervals correctly with monkey count', () => {
    /* Compare many draws of the same scheduler config; tier selection is
       random, so compare the scaled interval directly */
    const interval = 12000;
    expect(scaleByMonkeys(interval, 5)).toBeLessThan(scaleByMonkeys(interval, 1));
    expect(scaleByMonkeys(interval, 5)).toBeGreaterThanOrEqual(interval * 0.5);
  });

  it('should apply the 1.30x monkey cost multiplier chain', () => {
    const cost0 = getCost('monkeys', 0);
    const cost1 = getCost('monkeys', 1);
    const cost2 = getCost('monkeys', 2);

    expect(cost0).toBe(30);
    expect(cost1).toBe(39);
    expect(cost2).toBe(51);

    /* Verify multiplier chain */
    expect(cost1 / cost0).toBeCloseTo(1.3, 2);
  });
});
