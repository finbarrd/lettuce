import { DEFINITIONS } from './definitions-bundle.js';

/**
 * Look up a word's definition from the bundled dictionary.
 * Returns the definition string, or null if not found.
 */
export function getDefinition(word) {
  return DEFINITIONS[word.toLowerCase()] || null;
}

/**
 * Build a challenge question for a word using bundled definitions.
 * Returns { word, correctDefinition, choices } or null if word not in bundle.
 */
export function buildChallenge(word) {
  const correctDef = getDefinition(word);
  if (!correctDef) return null;

  // Pick 2 random decoy definitions from the bundle
  const allDefs = Object.entries(DEFINITIONS);
  const decoys = [];
  const shuffled = [...allDefs].sort(() => Math.random() - 0.5);

  for (const [w, def] of shuffled) {
    if (decoys.length >= 2) break;
    if (w.toLowerCase() !== word.toLowerCase() && def !== correctDef) {
      decoys.push(def);
    }
  }

  if (decoys.length < 2) return null;

  // Shuffle choices
  const choices = [correctDef, ...decoys];
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

/**
 * Check if a word has a bundled definition (for filtering).
 */
export function hasDefinition(word) {
  return word.toLowerCase() in DEFINITIONS;
}
