/* Unit tests for economy */

import { describe, it, expect } from 'vitest';
import {
  getCost,
  getNextCost,
  canAfford,
  getTotalMonkeys,
  getProductionMultiplier,
  getAutoSaleRate,
} from '../economy';

describe('Economy', () => {
  it('should calculate cost with 1.15x multiplier', () => {
    const cost0 = getCost('monkeys', 0);
    const cost1 = getCost('monkeys', 1);
    const cost2 = getCost('monkeys', 2);

    expect(cost0).toBe(100);
    expect(cost1).toBeCloseTo(115, 0);
    expect(cost2).toBeCloseTo(132, 0);
  });

  it('should check affordability with money', () => {
    expect(canAfford(100, 'monkeys', 0)).toBe(true);
    expect(canAfford(99, 'monkeys', 0)).toBe(false);
    expect(canAfford(500, 'trainedMonkeys', 0)).toBe(true);
  });

  it('should calculate total monkeys from upgrades', () => {
    const upgrades = {
      monkeys: 3,
      trainedMonkeys: 2,
      editorMonkeys: 1,
      caffeine: 5,
      salesMonkey: 1,
    };
    const total = getTotalMonkeys(upgrades);
    expect(total).toBe(3 + 2 + 1); // caffeine and salesMonkey don't count
  });

  it('should apply production multipliers', () => {
    const upgrades = {
      monkeys: 1,
      trainedMonkeys: 1,
      editorMonkeys: 1,
      caffeine: 1,
      salesMonkey: 0,
    };
    const mult = getProductionMultiplier(upgrades);

    // 1.5 (trained) * 2 (editor) * 1.1 (caffeine) = 3.3
    expect(mult).toBeCloseTo(1.5 * 2 * 1.1, 1);
  });

  it('should calculate auto-sale rate from sales monkeys', () => {
    const upgrades = { salesMonkey: 0 };
    expect(getAutoSaleRate(upgrades)).toBe(0);

    const upgrades2 = { salesMonkey: 3 };
    expect(getAutoSaleRate(upgrades2)).toBe(0.3); // 0.1 per sales monkey
  });

  it('should scale costs across different upgrade types', () => {
    const monkeyCost = getCost('monkeys', 0);
    const trainedCost = getCost('trainedMonkeys', 0);
    const editorCost = getCost('editorMonkeys', 0);
    const salesCost = getCost('salesMonkey', 0);

    expect(monkeyCost).toBe(30);
    expect(trainedCost).toBe(150);
    expect(editorCost).toBe(600);
    expect(salesCost).toBe(2000);
  });
});
