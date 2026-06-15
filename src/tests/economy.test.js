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
import { gameReducer, INITIAL_STATE, ACTIONS } from '../gameState';

describe('Economy', () => {
  it('should sell words at $2 per word', () => {
    expect(DOLLARS_PER_WORD).toBe(2);
  });

  it('should calculate monkey cost with 1.25x per-track multiplier', () => {
    expect(getCost('monkeys', 0)).toBe(30);
    expect(getCost('monkeys', 1)).toBe(38);
    expect(getCost('monkeys', 2)).toBe(47);
    expect(getCost('monkeys', 9)).toBe(224);
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
    expect(canAfford(38, 'monkeys', 1)).toBe(true);
    expect(canAfford(37, 'monkeys', 1)).toBe(false);
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

describe('Prestige reducer', () => {
  it('should reset game state and apply tenure on PRESTIGE', () => {
    const stateWithAnthology = {
      ...INITIAL_STATE,
      anthology: {
        ...INITIAL_STATE.anthology,
        collected: [{ text: 'such sweet sorrow', tier: 3, discoveredAt: 1000 }],
        totalWordsEver: 10,
      },
      resources: { ...INITIAL_STATE.resources, words: 50, money: 200 },
      upgrades: { ...INITIAL_STATE.upgrades, monkeys: 5 },
    };

    const newState = gameReducer(stateWithAnthology, { type: ACTIONS.PRESTIGE });

    expect(newState.prestige.count).toBe(1);
    expect(newState.upgrades.monkeys).toBe(1);
    expect(newState.anthology.collected.length).toBe(1);
    expect(newState.resources.money).toBe(80); // 30 + 1 * 50
    expect(newState.resources.words).toBe(0);
  });
});
