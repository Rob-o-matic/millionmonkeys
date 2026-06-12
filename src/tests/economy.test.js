/* Unit tests for economy */

import { describe, it, expect } from 'vitest';
import {
  getCost,
  getNextCost,
  canAfford,
  getTotalMonkeys,
  getProductionMultiplier,
  DOLLARS_PER_WORD,
} from '../economy';

describe('Economy', () => {
  it('should sell words at $2 per word', () => {
    expect(DOLLARS_PER_WORD).toBe(2);
  });

  it('should calculate monkey cost with 1.30x per-track multiplier', () => {
    expect(getCost('monkeys', 0)).toBe(30);
    expect(getCost('monkeys', 1)).toBe(39);
    expect(getCost('monkeys', 2)).toBe(51);
    expect(getCost('monkeys', 9)).toBe(318);
  });

  it('should calculate caffeine cost with 2.0x per-track multiplier', () => {
    expect(getCost('caffeine', 0)).toBe(60);
    expect(getCost('caffeine', 1)).toBe(120);
    expect(getCost('caffeine', 2)).toBe(240);
  });

  it('should calculate habitat and sales monkey costs with 1.15x multiplier', () => {
    expect(getCost('habitat', 0)).toBe(500);
    expect(getCost('habitat', 1)).toBe(575);
    expect(getCost('salesMonkey', 0)).toBe(2000);
    expect(getCost('salesMonkey', 1)).toBe(2300);
  });

  it('should return Infinity for unknown upgrade tracks', () => {
    expect(getCost('trainedMonkeys', 0)).toBe(Infinity);
    expect(getNextCost('editorMonkeys', 0)).toBe(Infinity);
  });

  it('should check affordability with money', () => {
    expect(canAfford(30, 'monkeys', 0)).toBe(true);
    expect(canAfford(29, 'monkeys', 0)).toBe(false);
    expect(canAfford(39, 'monkeys', 1)).toBe(true);
    expect(canAfford(38, 'monkeys', 1)).toBe(false);
  });

  it('should calculate total monkeys from upgrades', () => {
    const upgrades = {
      monkeys: 3,
      caffeine: 5,
      salesMonkey: 1,
    };
    const total = getTotalMonkeys(upgrades);
    expect(total).toBe(3); // caffeine and salesMonkey don't count
  });

  it('should apply 1.1x caffeine production multiplier per purchase', () => {
    expect(getProductionMultiplier({ monkeys: 1, caffeine: 0 })).toBe(1);
    expect(getProductionMultiplier({ monkeys: 1, caffeine: 1 })).toBeCloseTo(1.1, 5);
    expect(getProductionMultiplier({ monkeys: 1, caffeine: 3 })).toBeCloseTo(1.331, 3);
  });
});
