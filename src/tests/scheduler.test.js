/* Unit tests for scheduler */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createScheduler,
  scheduleNextGem,
  isPityActive,
  getGraceWindow,
  getBaseInterval,
  scaleByMonkeys,
  MAX_GEM_INTERVAL_MS,
  CAFFEINE_DIAL_STOPS,
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
    const result = scheduleNextGem(scheduler, currentTime, 1, CAFFEINE_DIAL_STOPS[2].weights, false);

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

  it('should select tiers by dial stop setting', () => {
    // Decaf: should favor lower tiers
    const decafTiers = [];
    for (let i = 0; i < 100; i++) {
      const result = scheduleNextGem(scheduler, i * 1000, 1, CAFFEINE_DIAL_STOPS[0].weights, false);
      decafTiers.push(result.tier);
    }
    const decafAvg =
      decafTiers.reduce((a, b) => a + b) / decafTiers.length;

    // The Jitters: should favor higher tiers
    scheduler = createScheduler();
    const jittersTiers = [];
    for (let i = 0; i < 100; i++) {
      const result = scheduleNextGem(scheduler, i * 1000, 1, CAFFEINE_DIAL_STOPS[4].weights, false);
      jittersTiers.push(result.tier);
    }
    const jittersAvg =
      jittersTiers.reduce((a, b) => a + b) / jittersTiers.length;

    expect(jittersAvg).toBeGreaterThan(decafAvg);
  });

  it('should never schedule a non-scripted gap above MAX_GEM_INTERVAL_MS', () => {
    /* Tier-3/4 awards must not silence the feed for their own 60s-20min
       base interval: rarity comes from selectTier weights, the GAP is
       capped at the Act 1 cadence ceiling (45s) */
    expect(MAX_GEM_INTERVAL_MS).toBe(45000);
    for (let i = 0; i < 500; i++) {
      const result = scheduleNextGem(scheduler, i * 1000, 1, CAFFEINE_DIAL_STOPS[4].weights, false); // The Jitters: mostly tier 3/4
      expect(result.delay).toBeLessThanOrEqual(MAX_GEM_INTERVAL_MS);
    }
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
