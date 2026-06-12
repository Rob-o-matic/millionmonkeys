/* Unit tests for scheduler */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createScheduler,
  scheduleNextGem,
  isPityActive,
  getGraceWindow,
  getBaseInterval,
  scaleByMonkeys,
} from '../scheduler';

describe('Scheduler', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = createScheduler();
  });

  it('should create a scheduler', () => {
    expect(scheduler.nextGemTime).toBe(0);
    expect(scheduler.pityTimers).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 });
  });

  it('should schedule next gem with delay in base interval range', () => {
    const currentTime = 0;
    const result = scheduleNextGem(scheduler, currentTime, 1, 0, false);

    expect(result.tier).toBeGreaterThanOrEqual(1);
    expect(result.tier).toBeLessThanOrEqual(4);
    expect(result.delay).toBeGreaterThan(0);
    expect(result.nextTime).toBe(currentTime + result.delay);
  });

  it('should scale intervals by monkey count', () => {
    const baseInterval = getBaseInterval(2);

    // More monkeys = shorter interval, clamped at the 50% floor
    expect(scaleByMonkeys(baseInterval, 1)).toBe(baseInterval);
    expect(scaleByMonkeys(baseInterval, 2)).toBe(baseInterval / 2);
    expect(scaleByMonkeys(baseInterval, 100)).toBe(baseInterval * 0.5);
  });

  it('should provide grace window per tier', () => {
    expect(getGraceWindow(1)).toBe(3000);
    expect(getGraceWindow(2)).toBe(4000);
    expect(getGraceWindow(3)).toBe(6000);
    expect(getGraceWindow(4)).toBe(8000);
    expect(getGraceWindow(5)).toBe(Infinity);
  });

  it('should select tiers by chaos setting', () => {
    // Trained: should favor lower tiers
    const trainedTiers = [];
    for (let i = 0; i < 100; i++) {
      const result = scheduleNextGem(scheduler, i * 1000, 1, 0, false);
      trainedTiers.push(result.tier);
    }
    const trainedAvg =
      trainedTiers.reduce((a, b) => a + b) / trainedTiers.length;

    // Chaotic: should favor higher tiers
    scheduler = createScheduler();
    const chaoticTiers = [];
    for (let i = 0; i < 100; i++) {
      const result = scheduleNextGem(scheduler, i * 1000, 1, 1, false);
      chaoticTiers.push(result.tier);
    }
    const chaoticAvg =
      chaoticTiers.reduce((a, b) => a + b) / chaoticTiers.length;

    expect(chaoticAvg).toBeGreaterThan(trainedAvg);
  });

  it('should trigger pity after pity window elapses', () => {
    const tierConfig = { baseMin: 4000, baseMax: 10000, pity: 15000 };
    scheduler.pityTimers[1] = 0;

    // Check pity at 20s (past 15s window)
    const isPity = isPityActive(scheduler, 1, 20000);
    expect(isPity).toBe(true);

    // Check pity at 10s (before 15s window)
    const isNoPity = isPityActive(scheduler, 1, 10000);
    expect(isNoPity).toBe(false);
  });
});
