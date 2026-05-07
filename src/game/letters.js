// English letter frequency distribution (percentage occurrence in typical text).
// Source: standard English corpus analysis.
const BASE_FREQUENCY = {
  E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1,
  R: 6.0, D: 4.3, L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2,
  G: 2.0, Y: 2.0, P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.15, X: 0.15,
  Q: 0.10, Z: 0.07,
};

// Scrabble-style letter values for bonus scoring of unusual words
export const LETTER_VALUES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
  I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
  Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
  Y: 4, Z: 10,
};

/**
 * Build a weighted letter pool for a given level.
 * Level 1 uses natural English frequency. Each subsequent level
 * gently flattens the distribution, giving less common letters
 * slightly more chance to appear.
 */
function buildWeightedPool(level) {
  const pool = [];
  const skewFactor = Math.min((level - 1) * 0.04, 0.6); // max 60% flattening

  for (const [letter, baseFreq] of Object.entries(BASE_FREQUENCY)) {
    // Blend between natural frequency and flat (equal) distribution.
    // flatFreq = 100/26 ≈ 3.85 for each letter
    const flatFreq = 100 / 26;
    const adjusted = baseFreq * (1 - skewFactor) + flatFreq * skewFactor;
    // Convert to integer weight (multiply by 10 for granularity)
    const weight = Math.max(1, Math.round(adjusted * 10));
    for (let i = 0; i < weight; i++) {
      pool.push(letter);
    }
  }
  return pool;
}

// Cache pools per level
const poolCache = {};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/**
 * Pick a random letter based on the current level.
 * Level 1 matches natural English; higher levels gradually introduce rarer letters.
 */
export function pickLetter(level) {
  if (!poolCache[level]) {
    poolCache[level] = buildWeightedPool(level);
  }
  const pool = poolCache[level];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick a random vowel based on the current level.
 */
export function pickVowel(level) {
  if (!poolCache[level]) {
    poolCache[level] = buildWeightedPool(level);
  }
  const pool = poolCache[level].filter(l => VOWELS.has(l));
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick a random consonant based on the current level.
 */
export function pickConsonant(level) {
  if (!poolCache[level]) {
    poolCache[level] = buildWeightedPool(level);
  }
  const pool = poolCache[level].filter(l => !VOWELS.has(l));
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Score a word. Sum of Scrabble-style letter values, multiplied by word length.
 * Longer words with rare letters score significantly more.
 */
export function scoreWord(word) {
  const len = word.length;
  if (len < 4) return 0;

  const letterTotal = word
    .split('')
    .reduce((sum, ch) => sum + (LETTER_VALUES[ch] || 0), 0);

  return letterTotal * len;
}
