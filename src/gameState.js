/* Game state machine with Acts 2–3 dormant behind triggers */

import { DOLLARS_PER_WORD } from './economy';

export const TIER_WORD_MULTIPLIERS = { 1: 1, 2: 3, 3: 7.5, 4: 20 };

export const INITIAL_STATE = {
  act: 1,
  phase: 1, // NEW: 1 = breeding phase, 2 = information empire
  driftProgress: 0,
  resources: {
    words: 0,
    money: 30,        // Enough for first monkey purchase
    bananas: 0,       // Unlocks at breeding alert (8 monkeys); 100 gifted at unlock
    marketingBudget: 0, // NEW: earned from text share milestones
    influence: 0,     // NEW: earned from text share milestones
    matter: 0,
    energy: 0,
  },
  upgrades: {
    monkeys: 0,        // Start with ZERO monkeys
    habitat: 0,
    caffeine: 0,
    salesMonkey: 0,
    /* Act 2+ upgrades dormant */
  },
  costBasis: {
    monkeys: 0,        // Number of purchased monkeys (for cost calculation)
  },
  breedingUpgrades: {
    // Removed - simplified to habitat upgrades only
  },
  anthology: {
    words: [], // [{ text, tier, timestamp }]
    totalWordsEver: 0, // For Shakespeare progress (cosmetic)
    pages: {}, // { pageKey: { required: [], collected: [] } }
  },
  scheduler: {
    nextGemTime: 0,
    pityTimers: {
      tier1: 0,
      tier2: 0,
      tier3: 0,
      tier4: 0,
    },
    chaos: 0, // 0 = trained, 1 = chaotic
    lastRetrain: 0,
  },
  ui: {
    shakespeareProgress: 0,
    earthTextShare: 0,       // NEW: % of Earth's text controlled
    sectorsControlled: [],   // NEW: array of sector IDs
    libraryProgress: 0,
    autoSaleRate: 0,   // Words per second being auto-sold
  },
};

/* Action types */
export const ACTIONS = {
  ADD_WORD: 'ADD_WORD',
  HARVEST_WORD: 'HARVEST_WORD',
  SELL_WORDS: 'SELL_WORDS',
  ADD_MONEY: 'ADD_MONEY',
  ADD_MARKETING_BUDGET: 'ADD_MARKETING_BUDGET',
  ADD_INFLUENCE: 'ADD_INFLUENCE',
  BUY_UPGRADE: 'BUY_UPGRADE',
  ADD_BRED_MONKEY: 'ADD_BRED_MONKEY',
  SCHEDULE_GEM: 'SCHEDULE_GEM',
  SET_CHAOS: 'SET_CHAOS',
  SET_PHASE: 'SET_PHASE',
  UPDATE_TEXT_SHARE: 'UPDATE_TEXT_SHARE',
  CONTROL_SECTOR: 'CONTROL_SECTOR',
  PRESTIGE: 'PRESTIGE',
  RESET_GAME: 'RESET_GAME',
  UPDATE_SCHEDULER: 'UPDATE_SCHEDULER',
  SET_DRIFT: 'SET_DRIFT',
  BUY_BANANAS: 'BUY_BANANAS',
  CONSUME_BANANAS: 'CONSUME_BANANAS',
};

/* Reducer */
export function gameReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ACTIONS.ADD_WORD:
      return {
        ...state,
        resources: {
          ...state.resources,
          words: state.resources.words + action.payload,
        },
      };

    case ACTIONS.HARVEST_WORD: {
      const wordCount = action.payload.count || 1;
      const tierMult = TIER_WORD_MULTIPLIERS[action.payload.tier || 1] || 1;
      return {
        ...state,
        anthology: {
          ...state.anthology,
          words: [
            ...state.anthology.words,
            {
              text: action.payload.text,
              tier: action.payload.tier,
              timestamp: Date.now(),
            },
          ],
          totalWordsEver: state.anthology.totalWordsEver + wordCount,
        },
        resources: {
          ...state.resources,
          words: state.resources.words + wordCount * tierMult,
        },
      };
    }

    case ACTIONS.SELL_WORDS:
      // Convert all words to money at fixed rate
      const wordsSold = state.resources.words;
      const moneyEarned = wordsSold * DOLLARS_PER_WORD;
      return {
        ...state,
        resources: {
          ...state.resources,
          words: 0,
          money: state.resources.money + moneyEarned,
        },
      };

    case ACTIONS.ADD_MONEY:
      return {
        ...state,
        resources: {
          ...state.resources,
          money: state.resources.money + action.payload,
        },
      };

    case ACTIONS.ADD_MARKETING_BUDGET:
      return {
        ...state,
        resources: {
          ...state.resources,
          marketingBudget: state.resources.marketingBudget + action.payload,
        },
      };

    case ACTIONS.ADD_INFLUENCE:
      return {
        ...state,
        resources: {
          ...state.resources,
          influence: state.resources.influence + action.payload,
        },
      };

    case ACTIONS.SET_PHASE:
      return {
        ...state,
        phase: action.payload,
      };

    case ACTIONS.UPDATE_TEXT_SHARE:
      return {
        ...state,
        ui: {
          ...state.ui,
          earthTextShare: action.payload,
        },
      };

    case ACTIONS.CONTROL_SECTOR:
      return {
        ...state,
        ui: {
          ...state.ui,
          sectorsControlled: [...state.ui.sectorsControlled, action.payload],
        },
      };

    case ACTIONS.BUY_UPGRADE:
      const { upgradeKey, cost } = action.payload;
      if (state.resources.money < cost) return state;

      return {
        ...state,
        resources: {
          ...state.resources,
          money: state.resources.money - cost,
        },
        upgrades: {
          ...state.upgrades,
          [upgradeKey]: (state.upgrades[upgradeKey] || 0) + 1,
        },
        costBasis: upgradeKey === 'monkeys' ? {
          ...state.costBasis,
          monkeys: (state.costBasis.monkeys || 0) + 1,
        } : state.costBasis,
        driftProgress: state.act > 1 ? Math.min(1, state.driftProgress + 0.08) : 0, // Drift only in Act 2+
      };

    case ACTIONS.ADD_BRED_MONKEY:
      // Add bred monkeys without affecting cost calculation
      return {
        ...state,
        upgrades: {
          ...state.upgrades,
          monkeys: (state.upgrades.monkeys || 0) + action.payload,
        },
      };

    case ACTIONS.SCHEDULE_GEM:
      return {
        ...state,
        scheduler: {
          ...state.scheduler,
          nextGemTime: action.payload,
        },
      };

    case ACTIONS.SET_CHAOS:
      return {
        ...state,
        scheduler: {
          ...state.scheduler,
          chaos: action.payload,
          lastRetrain: Date.now(),
        },
      };

    case ACTIONS.UPDATE_SCHEDULER:
      return {
        ...state,
        scheduler: {
          ...state.scheduler,
          ...action.payload,
        },
      };

    case ACTIONS.SET_DRIFT:
      return {
        ...state,
        driftProgress: action.payload,
      };

    case ACTIONS.PRESTIGE:
      // Prestige is unlocked in Phase 2
      return state;

    case ACTIONS.BUY_BANANAS:
      return {
        ...state,
        resources: {
          ...state.resources,
          bananas: state.resources.bananas + action.payload.count,
          money: state.resources.money - action.payload.cost,
        },
      };

    case ACTIONS.CONSUME_BANANAS:
      return {
        ...state,
        resources: {
          ...state.resources,
          bananas: Math.max(0, state.resources.bananas - action.payload),
        },
      };

    case ACTIONS.RESET_GAME:
      return INITIAL_STATE;

    default:
      return state;
  }
}

