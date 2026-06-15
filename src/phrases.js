/* Gem text pools for the post-scripted scheduler (App.jsx).
   Multi-word phrases can NEVER occur naturally in the gibberish stream,
   so tier 3-4 finds are unmistakably "the monkeys typed something".
   NOTE: 'to be or not to be' is deliberately absent — it is reserved for
   the tier-5 Shakespeare beat (the 35s near-miss pays it off). */

export const TIER3_PHRASES = [
  'brave new world',
  'wherefore art thou',
  'all the world',
  'a piece of work',
  'the winter of',
  'such sweet sorrow',
  'once more unto',
  'all that glisters',
  'a pound of flesh',
  'the undiscovered country',
  'what dreams may come',
  'band of brothers',
];

export const TIER4_PHRASES = [
  'all the world is a stage',
  'something wicked this way comes',
  'we are such stuff as dreams',
  'the rest is silence silence silence',
  'lord what fools these mortals be',
  'a tale told by an idiot',
];

/* Pick the display/harvest text for a scheduler gem of the given tier.
   Tier 1: any dictionary word. Tier 2: a long (>=8 char) dictionary word.
   Tier 3: short Shakespeare-adjacent phrase. Tier 4+: longer anomaly. */
export function pickGemText(tier, dictionary) {
  if (tier >= 4) {
    return TIER4_PHRASES[Math.floor(Math.random() * TIER4_PHRASES.length)];
  }
  if (tier === 3) {
    return TIER3_PHRASES[Math.floor(Math.random() * TIER3_PHRASES.length)];
  }

  if (!dictionary || dictionary.length === 0) return null;

  if (tier === 2) {
    for (let i = 0; i < 10; i++) {
      const word = dictionary[Math.floor(Math.random() * dictionary.length)];
      if (word.length >= 8) return word;
    }
    // Fall back to any word if no long one was found
  }

  return dictionary[Math.floor(Math.random() * dictionary.length)];
}
