// Word dictionary for Lettuce game.
// Uses the comprehensive embedded word list of common 4-6 letter English words.

import { WORDS } from './wordlist.js';

const WORD_SET = new Set();
let loaded = false;
let loadPromise = null;

/**
 * Initialize the word dictionary from the embedded word list.
 */
export function initDictionary() {
  if (loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    WORDS.forEach(w => WORD_SET.add(w.toUpperCase()));
    loaded = true;
    resolve();
  });

  return loadPromise;
}

/**
 * Check if a word is valid (exists in dictionary and is 4+ letters).
 */
export function isValidWord(word) {
  if (!word || word.length < 4) return false;
  return WORD_SET.has(word.toUpperCase());
}

/**
 * Get the word set size (for debugging/display).
 */
export function getDictionarySize() {
  return WORD_SET.size;
}
