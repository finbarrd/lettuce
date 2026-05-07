import { pickLetter, pickVowel, pickConsonant, scoreWord } from './letters.js';
import { isValidWord } from './dictionary.js';

export const GRID_WIDTH = 6;
export const GRID_HEIGHT = 12;
export const MIN_WORD_LENGTH = 4;
export const WORDS_PER_LEVEL = 10;
export const LETTUCE_CHANCE = 1 / 12; // ~1 in 12 blocks is a lettuce wildcard

// Sentinel value for a lettuce wildcard on the grid (unresolved)
export const LETTUCE = '🥬';

/**
 * Generate the next piece data.
 * Each piece offers two letters: one consonant and one vowel, in random order.
 * Lettuce wildcards replace both options with a single lettuce.
 */
function generatePiece(level, piecesSinceLastLettuce) {
  let isLettuce = false;
  if (piecesSinceLastLettuce >= 11) {
    isLettuce = true;
  } else {
    isLettuce = Math.random() < LETTUCE_CHANCE;
  }

  if (isLettuce) {
    return { letter: LETTUCE, isLettuce: true, pair: null };
  }

  const vowel = pickVowel(level);
  const consonant = pickConsonant(level);
  // Random order: left and right
  const pair = Math.random() < 0.5
    ? { left: consonant, right: vowel }
    : { left: vowel, right: consonant };

  return { letter: pair.left, isLettuce: false, pair };
}

/**
 * Create an empty game state.
 */
export function createGameState() {
  const nextPieceData = generatePiece(1, 0);
  return {
    grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null)),
    currentPiece: null,
    nextPiece: nextPieceData, // preview of next piece
    score: 0,
    wordsFound: [],
    pieceCount: 0,
    gameOver: false,
    level: 1,
    wordsThisLevel: 0,
    dropInterval: 1000, // ms between automatic drops
    piecesSinceLastLettuce: nextPieceData.isLettuce ? 0 : 1,
  };
}

/**
 * Spawn a new falling letter piece from the nextPiece queue,
 * and pre-generate the following piece for the preview.
 */
export function spawnPiece(state) {
  const col = Math.floor(GRID_WIDTH / 2);

  // Check if spawn position is blocked
  if (state.grid[0][col] !== null) {
    return { ...state, gameOver: true };
  }

  // Current piece comes from the pre-generated nextPiece
  const { letter, isLettuce, pair } = state.nextPiece;

  // Generate the new next piece
  const sinceLettuce = isLettuce ? 0 : state.piecesSinceLastLettuce;
  const newNextPiece = generatePiece(state.level, sinceLettuce);

  return {
    ...state,
    currentPiece: { letter, row: 0, col, isLettuce, letterChosen: false, pair },
    nextPiece: newNextPiece,
    pieceCount: state.pieceCount + 1,
    piecesSinceLastLettuce: newNextPiece.isLettuce ? 0 : sinceLettuce + 1,
  };
}

/**
 * Choose a letter for a lettuce wildcard piece.
 * Only works once - if already chosen, does nothing.
 */
export function chooseLettuceLetter(state, chosenLetter) {
  if (!state.currentPiece || state.gameOver) return state;
  if (!state.currentPiece.isLettuce || state.currentPiece.letterChosen) return state;

  return {
    ...state,
    currentPiece: {
      ...state.currentPiece,
      letter: chosenLetter.toUpperCase(),
      letterChosen: true,
    },
  };
}

/**
 * Switch the active letter of the current piece between the pair options.
 * Only works for non-lettuce pieces that have a pair.
 */
export function switchLetter(state) {
  if (!state.currentPiece || state.gameOver) return state;
  if (state.currentPiece.isLettuce || !state.currentPiece.pair) return state;

  const { pair, letter } = state.currentPiece;
  const newLetter = letter === pair.left ? pair.right : pair.left;

  return {
    ...state,
    currentPiece: { ...state.currentPiece, letter: newLetter },
  };
}

/**
 * Move the current piece left or right.
 */
export function movePiece(state, direction) {
  if (!state.currentPiece || state.gameOver) return state;

  const newCol = state.currentPiece.col + direction;
  if (newCol < 0 || newCol >= GRID_WIDTH) return state;
  if (state.grid[state.currentPiece.row][newCol] !== null) return state;

  return {
    ...state,
    currentPiece: { ...state.currentPiece, col: newCol },
  };
}

/**
 * Drop the piece down one row. If it can't move, lock it in place.
 */
export function dropPiece(state) {
  if (!state.currentPiece || state.gameOver) return state;

  const { row, col, letter } = state.currentPiece;
  const newRow = row + 1;

  // Can the piece move down?
  if (newRow < GRID_HEIGHT && state.grid[newRow][col] === null) {
    return {
      ...state,
      currentPiece: { ...state.currentPiece, row: newRow },
    };
  }

  // Lock piece in place
  const newGrid = state.grid.map(r => [...r]);

  // If it's an unresolved lettuce, randomly assign a letter
  let finalLetter = letter;
  if (state.currentPiece.isLettuce && !state.currentPiece.letterChosen) {
    finalLetter = pickLetter(state.level);
  }
  newGrid[row][col] = finalLetter;

  // Check for words and clear them
  const { grid: clearedGrid, points, words } = findAndClearWords(newGrid);

  // Level progression: advance level every WORDS_PER_LEVEL words
  const newWordsThisLevel = state.wordsThisLevel + words.length;
  const levelsGained = Math.floor(newWordsThisLevel / WORDS_PER_LEVEL);
  const newLevel = state.level + levelsGained;
  const remainingWords = newWordsThisLevel % WORDS_PER_LEVEL;

  // Speed: level gives big step-changes, piece count adds gradual pressure
  // Every 10 pieces, drop interval shrinks by 3%
  const newPieceCount = state.pieceCount + 1;
  const baseInterval = 1000 - (newLevel - 1) * 60;
  const pieceSpeedup = Math.pow(0.97, Math.floor(newPieceCount / 10));
  const newDropInterval = Math.max(150, Math.round(baseInterval * pieceSpeedup));

  return {
    ...state,
    grid: clearedGrid,
    currentPiece: null,
    score: state.score + points,
    wordsFound: [...state.wordsFound, ...words],
    level: newLevel,
    wordsThisLevel: remainingWords,
    dropInterval: newDropInterval,
  };
}

/**
 * Hard drop - instantly drop piece to lowest possible position.
 */
export function hardDrop(state) {
  if (!state.currentPiece || state.gameOver) return state;

  let current = state;
  while (current.currentPiece) {
    const next = dropPiece(current);
    if (next === current) break;
    current = next;
  }
  return current;
}

/**
 * Scan the grid for valid words horizontally and vertically.
 * Clear found words and apply gravity.
 */
function findAndClearWords(grid) {
  const foundWords = [];
  const cellsToRemove = new Set();

  // Check horizontal words (left to right)
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let startCol = 0; startCol <= GRID_WIDTH - MIN_WORD_LENGTH; startCol++) {
      for (let endCol = startCol + MIN_WORD_LENGTH - 1; endCol < GRID_WIDTH; endCol++) {
        // All cells in range must be filled
        let word = '';
        let valid = true;
        for (let c = startCol; c <= endCol; c++) {
          if (grid[row][c] === null) { valid = false; break; }
          word += grid[row][c];
        }
        if (valid && isValidWord(word)) {
          foundWords.push(word);
          for (let c = startCol; c <= endCol; c++) {
            cellsToRemove.add(`${row},${c}`);
          }
        }
      }
    }
  }

  // Check vertical words (top to bottom)
  for (let col = 0; col < GRID_WIDTH; col++) {
    for (let startRow = 0; startRow <= GRID_HEIGHT - MIN_WORD_LENGTH; startRow++) {
      for (let endRow = startRow + MIN_WORD_LENGTH - 1; endRow < GRID_HEIGHT; endRow++) {
        let word = '';
        let valid = true;
        for (let r = startRow; r <= endRow; r++) {
          if (grid[r][col] === null) { valid = false; break; }
          word += grid[r][col];
        }
        if (valid && isValidWord(word)) {
          foundWords.push(word);
          for (let r = startRow; r <= endRow; r++) {
            cellsToRemove.add(`${r},${col}`);
          }
        }
      }
    }
  }

  // Remove cells and apply gravity
  let points = 0;
  if (cellsToRemove.size > 0) {
    for (const key of cellsToRemove) {
      const [r, c] = key.split(',').map(Number);
      grid[r][c] = null;
    }

    // Apply gravity - letters fall down to fill gaps
    for (let col = 0; col < GRID_WIDTH; col++) {
      let writeRow = GRID_HEIGHT - 1;
      for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
        if (grid[row][col] !== null) {
          if (writeRow !== row) {
            grid[writeRow][col] = grid[row][col];
            grid[row][col] = null;
          }
          writeRow--;
        }
      }
    }

    // Score each word found
    points = foundWords.reduce((sum, word) => sum + scoreWord(word), 0);
  }

  return { grid, points, words: foundWords };
}
