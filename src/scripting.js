/* Scripted first-60-seconds sequence */

export const FIRST_60_SECONDS = [
  {
    time: 2000,
    tier: 1,
    text: 'the',
    description: 'First word - immediate reward',
    isNearMiss: false,
  },
  {
    time: 4000,
    tier: 1,
    text: 'monkey',
    description: 'Second discovery',
    isNearMiss: false,
  },
  {
    time: 6000,
    tier: 2,
    text: 'infinite monkeys',
    description: 'First phrase - bigger discovery',
    isNearMiss: false,
  },
  {
    time: 10000,
    tier: 1,
    text: 'shakespeare',
    description: 'Theme word',
    isNearMiss: false,
  },
  {
    time: 15000,
    tier: 1,
    text: 'complete',
    description: 'Another word',
    isNearMiss: false,
  },
  {
    time: 20000,
    tier: 2,
    text: 'complete works',
    description: 'Second phrase',
    isNearMiss: false,
  },
  {
    time: 28000,
    tier: 1,
    text: 'type',
    description: 'Action word',
    isNearMiss: false,
  },
  {
    time: 35000,
    tier: 2,
    text: 'to be or not to bq',
    description: 'Scripted near-miss - teaches heartbreak',
    isNearMiss: true,
  },
];

/* Check if we're still in scripted sequence */
export function isScriptedPhase(currentTime) {
  return currentTime < 60000;
}

/* Get next scripted gem or null if past scripting */
export function getNextScriptedGem(currentTime) {
  for (const gem of FIRST_60_SECONDS) {
    if (gem.time >= currentTime) {
      return gem;
    }
  }
  return null;
}

/* Get the current scripted gem or null */
export function getCurrentScriptedGem(currentTime) {
  let found = null;
  for (const gem of FIRST_60_SECONDS) {
    if (gem.time <= currentTime) {
      found = gem;
    } else {
      break;
    }
  }
  return found;
}
