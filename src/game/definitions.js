const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Cache fetched definitions to avoid repeated API calls
const definitionCache = new Map();

/**
 * Fetch the definition of a word from the free dictionary API.
 * Returns the first short definition string, or null if not found.
 * Uses a cache to avoid rate limiting.
 */
export async function fetchDefinition(word) {
  const key = word.toLowerCase();
  if (definitionCache.has(key)) return definitionCache.get(key);

  try {
    const res = await fetch(`${API_BASE}${key}`);
    if (!res.ok) {
      definitionCache.set(key, null);
      return null;
    }
    const data = await res.json();
    for (const entry of data) {
      for (const meaning of entry.meanings || []) {
        for (const def of meaning.definitions || []) {
          if (def.definition) {
            definitionCache.set(key, def.definition);
            return def.definition;
          }
        }
      }
    }
    definitionCache.set(key, null);
    return null;
  } catch {
    // Don't cache network errors - might work next time
    return null;
  }
}

// Pre-fetched decoy definitions (filled at startup)
let decoyDefinitions = [];
let decoysReady = false;

/**
 * Pre-fetch decoy definitions at game start so they're instantly available.
 */
export async function prefetchDecoys() {
  if (decoysReady) return;
  const shuffled = [...DECOY_POOL].sort(() => Math.random() - 0.5);
  const batch = shuffled.slice(0, 20);

  // Fetch in small batches to avoid rate limiting
  for (let i = 0; i < batch.length; i += 3) {
    const chunk = batch.slice(i, i + 3);
    const results = await Promise.all(
      chunk.map(async (word) => {
        const def = await fetchDefinition(word);
        return def ? { word, definition: def } : null;
      })
    );
    for (const r of results) {
      if (r) decoyDefinitions.push(r);
    }
    // Small delay between batches
    if (i + 3 < batch.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  decoysReady = true;
}

/**
 * Build a challenge question for a word.
 * Uses cached decoy definitions for speed and to avoid rate limits.
 * Returns { word, correctDefinition, choices } or null if API fails.
 */
export async function buildChallenge(word) {
  // Fetch real definition
  const correctDef = await fetchDefinition(word);
  if (!correctDef) return null;

  // Pick 2 random decoy definitions from pre-fetched pool
  const validDecoys = decoyDefinitions.filter(
    d => d.word.toUpperCase() !== word.toUpperCase() && d.definition !== correctDef
  );

  if (validDecoys.length < 2) {
    // Fallback: try fetching a few fresh decoys
    const fresh = DECOY_POOL.filter(w => w.toUpperCase() !== word.toUpperCase())
      .sort(() => Math.random() - 0.5).slice(0, 4);
    for (const decoy of fresh) {
      if (validDecoys.length >= 2) break;
      const def = await fetchDefinition(decoy);
      if (def && def !== correctDef) {
        validDecoys.push({ word: decoy, definition: def });
      }
    }
  }

  if (validDecoys.length < 2) return null;

  const shuffledDecoys = [...validDecoys].sort(() => Math.random() - 0.5);
  const chosen = shuffledDecoys.slice(0, 2);

  // Shuffle choices
  const choices = [correctDef, chosen[0].definition, chosen[1].definition];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return {
    word,
    correctDefinition: correctDef,
    choices,
  };
}

// A pool of common decoy words to fetch alternative definitions from
const DECOY_POOL = [
  'apple', 'brave', 'chair', 'dance', 'eager', 'flame', 'globe', 'heart',
  'ivory', 'judge', 'kneel', 'lemon', 'magic', 'noble', 'ocean', 'piano',
  'queen', 'river', 'stone', 'tower', 'umbra', 'vivid', 'wheat', 'youth',
  'blaze', 'crane', 'drift', 'ember', 'frost', 'grain', 'haven', 'jewel',
  'lunar', 'marsh', 'nervy', 'orbit', 'prism', 'quilt', 'roost', 'siren',
  'thorn', 'unity', 'vapor', 'wield', 'xerox', 'yield', 'zonal', 'brisk',
  'cloak', 'dwell', 'exile', 'forge', 'glyph', 'haste', 'ingot', 'joust',
  'knack', 'lodge', 'mirth', 'nexus', 'oasis', 'plume', 'quota', 'reign',
];

/**
 * Pick random decoy words (excluding the target word).
 */
export function pickDecoys(excludeWord, count = 6) {
  const filtered = DECOY_POOL.filter(w => w.toUpperCase() !== excludeWord.toUpperCase());
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
