import { pickLetter, pickSingleTileLetter, pickDigraph, scoreWord } from './letters.js';
import { isValidWord } from './dictionary.js';

export const GRID_WIDTH = 6;
export const GRID_HEIGHT = 12;
export const MIN_WORD_LENGTH = 4;
export const WORDS_PER_LEVEL = 10;
export const LETTUCE_CHANCE = 1 / 12; // ~1 in 12 blocks is a lettuce wildcard

// Sentinel value for a lettuce wildcard on the grid (unresolved)
export const LETTUCE = '🥬';

// Anti-clockwise rotation: 4 states where letters[0] and letters[1]
// rotate as a pair around the anchor point.
// Offsets are [letters[0] offset, letters[1] offset] relative to anchor (row, col).
// State 0: [0] left,  [1] right  (horizontal)
// State 1: [0] below, [1] above  (vertical, anti-clockwise from horizontal)
// State 2: [0] right, [1] left   (horizontal, reversed)
// State 3: [0] above, [1] below  (vertical)
const ROTATION_OFFSETS = [
  [{ dr: 0, dc: 0 }, { dr: 0, dc: 1 }],   // [0] at anchor, [1] right
  [{ dr: 1, dc: 0 }, { dr: 0, dc: 0 }],   // [0] below anchor, [1] at anchor
  [{ dr: 0, dc: 1 }, { dr: 0, dc: 0 }],   // [0] right of anchor, [1] at anchor
  [{ dr: 0, dc: 0 }, { dr: 1, dc: 0 }],   // [0] at anchor, [1] below
];

/**
 * Get the two cell positions for a pair piece given anchor + rotation state.
 */
function getPairCells(row, col, rotationIndex) {
  const offsets = ROTATION_OFFSETS[rotationIndex];
  return [
    { row: row + offsets[0].dr, col: col + offsets[0].dc },
    { row: row + offsets[1].dr, col: col + offsets[1].dc },
  ];
}

/**
 * Check if all given cells are within grid bounds and unoccupied.
 */
function cellsFree(grid, cells) {
  return cells.every(
    c => c.row >= 0 && c.row < GRID_HEIGHT &&
         c.col >= 0 && c.col < GRID_WIDTH &&
         grid[c.row][c.col] === null
  );
}

/**
 * Generate the next piece data.
 * Pieces are either:
 * - Lettuce wildcard (single tile)
 * - Single tile (high-value letter, score >= 3)
 * - Pair tile (two-cell digraph of low-value letters, score 1-2)
 *
 * Single vs pair probability: ~30% single, ~70% pair (matching natural
 * frequency since most common letters are low-value).
 */
function generatePiece(level, piecesSinceLastLettuce) {
  let isLettuce = false;
  if (piecesSinceLastLettuce >= 11) {
    isLettuce = true;
  } else {
    isLettuce = Math.random() < LETTUCE_CHANCE;
  }

  if (isLettuce) {
    return { type: 'single', letter: LETTUCE, isLettuce: true };
  }

  // ~30% chance single tile, ~70% pair tile
  if (Math.random() < 0.3) {
    const letter = pickSingleTileLetter(level);
    return { type: 'single', letter, isLettuce: false };
  }

  const [a, b] = pickDigraph(level);
  return { type: 'pair', letters: [a, b], rotationIndex: 0 };
}

/**
 * Create an empty game state.
 */
export function createGameState() {
  const nextPieceData = generatePiece(1, 0);
  return {
    grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null)),
    currentPiece: null,
    nextPiece: nextPieceData,
    score: 0,
    wordsFound: [],
    pieceCount: 0,
    gameOver: false,
    level: 1,
    wordsThisLevel: 0,
    dropInterval: 1000,
    piecesSinceLastLettuce: nextPieceData.isLettuce ? 0 : 1,
  };
}

/**
 * Spawn a new falling piece from the nextPiece queue.
 */
export function spawnPiece(state) {
  const col = Math.floor(GRID_WIDTH / 2) - 1; // center, leaving room for pairs
  const pieceData = state.nextPiece;
  const sinceLettuce = pieceData.isLettuce ? 0 : state.piecesSinceLastLettuce;
  const newNextPiece = generatePiece(state.level, sinceLettuce);

  if (pieceData.type === 'single') {
    if (state.grid[0][col] !== null) {
      return { ...state, gameOver: true };
    }
    return {
      ...state,
      currentPiece: {
        type: 'single',
        letter: pieceData.letter,
        row: 0,
        col,
        isLettuce: pieceData.isLettuce,
        letterChosen: false,
      },
      nextPiece: newNextPiece,
      pieceCount: state.pieceCount + 1,
      piecesSinceLastLettuce: newNextPiece.isLettuce ? 0 : sinceLettuce + 1,
    };
  }

  // Pair piece - spawns horizontal at top
  const cells = getPairCells(0, col, pieceData.rotationIndex);
  if (!cellsFree(state.grid, cells)) {
    return { ...state, gameOver: true };
  }

  return {
    ...state,
    currentPiece: {
      type: 'pair',
      letters: pieceData.letters,
      row: 0,
      col,
      rotationIndex: pieceData.rotationIndex,
    },
    nextPiece: newNextPiece,
    pieceCount: state.pieceCount + 1,
    piecesSinceLastLettuce: newNextPiece.isLettuce ? 0 : sinceLettuce + 1,
  };
}

/**
 * Choose a letter for a lettuce wildcard piece.
 */
export function chooseLettuceLetter(state, chosenLetter) {
  if (!state.currentPiece || state.gameOver) return state;
  if (state.currentPiece.type !== 'single') return state;
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
 * Rotate a pair piece anti-clockwise with Tetris-style wall kicks.
 * If rotation is blocked in place, try shifting the anchor to nearby
 * positions (left, right, up, left+up, right+up) to find a valid fit.
 */
export function rotatePiece(state) {
  if (!state.currentPiece || state.gameOver) return state;
  if (state.currentPiece.type !== 'pair') return state;

  const { row, col, rotationIndex } = state.currentPiece;
  const newIndex = (rotationIndex + 1) % 4;

  // Wall kick offsets to try: original position first, then shifts
  const kicks = [
    { dr: 0, dc: 0 },
    { dr: 0, dc: -1 },  // left
    { dr: 0, dc: 1 },   // right
    { dr: -1, dc: 0 },  // up
    { dr: -1, dc: -1 }, // up-left
    { dr: -1, dc: 1 },  // up-right
  ];

  for (const kick of kicks) {
    const kickRow = row + kick.dr;
    const kickCol = col + kick.dc;
    const newCells = getPairCells(kickRow, kickCol, newIndex);
    if (cellsFree(state.grid, newCells)) {
      return {
        ...state,
        currentPiece: {
          ...state.currentPiece,
          row: kickRow,
          col: kickCol,
          rotationIndex: newIndex,
        },
      };
    }
  }

  // All kicks failed - rotation is truly blocked
  return state;
}

/**
 * Move the current piece left or right.
 */
export function movePiece(state, direction) {
  if (!state.currentPiece || state.gameOver) return state;

  const { row, col } = state.currentPiece;
  const newCol = col + direction;

  if (state.currentPiece.type === 'single') {
    if (newCol < 0 || newCol >= GRID_WIDTH) return state;
    if (state.grid[row][newCol] !== null) return state;
    return { ...state, currentPiece: { ...state.currentPiece, col: newCol } };
  }

  // Pair piece: check both cells at new position
  const newCells = getPairCells(row, newCol, state.currentPiece.rotationIndex);
  if (!cellsFree(state.grid, newCells)) return state;

  return { ...state, currentPiece: { ...state.currentPiece, col: newCol } };
}

/**
 * Drop the piece down one row. If it can't move, lock it in place.
 */
export function dropPiece(state) {
  if (!state.currentPiece || state.gameOver) return state;

  const { row, col } = state.currentPiece;
  const newRow = row + 1;

  if (state.currentPiece.type === 'single') {
    const { letter } = state.currentPiece;

    // Can the piece move down?
    if (newRow < GRID_HEIGHT && state.grid[newRow][col] === null) {
      return { ...state, currentPiece: { ...state.currentPiece, row: newRow } };
    }

    // Lock single piece
    const newGrid = state.grid.map(r => [...r]);
    let finalLetter = letter;
    if (state.currentPiece.isLettuce && !state.currentPiece.letterChosen) {
      finalLetter = pickLetter(state.level);
    }
    newGrid[row][col] = finalLetter;

    return lockAndScore(state, newGrid);
  }

  // Pair piece: try to drop both cells
  const newCells = getPairCells(newRow, col, state.currentPiece.rotationIndex);
  if (cellsFree(state.grid, newCells)) {
    return { ...state, currentPiece: { ...state.currentPiece, row: newRow } };
  }

  // Lock pair piece - write both letters to grid
  const currentCells = getPairCells(row, col, state.currentPiece.rotationIndex);
  const newGrid = state.grid.map(r => [...r]);
  newGrid[currentCells[0].row][currentCells[0].col] = state.currentPiece.letters[0];
  newGrid[currentCells[1].row][currentCells[1].col] = state.currentPiece.letters[1];

  return lockAndScore(state, newGrid);
}

/**
 * After locking a piece, check for words, apply scoring and level progression.
 */
function lockAndScore(state, newGrid) {
  const { grid: clearedGrid, points, words } = findAndClearWords(newGrid);

  const newWordsThisLevel = state.wordsThisLevel + words.length;
  const levelsGained = Math.floor(newWordsThisLevel / WORDS_PER_LEVEL);
  const newLevel = state.level + levelsGained;
  const remainingWords = newWordsThisLevel % WORDS_PER_LEVEL;

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
 * Get the display cells for the current piece (used by rendering).
 * Returns an array of { row, col, letter } objects.
 */
export function getCurrentPieceCells(piece) {
  if (!piece) return [];

  if (piece.type === 'single') {
    return [{ row: piece.row, col: piece.col, letter: piece.letter }];
  }

  const cells = getPairCells(piece.row, piece.col, piece.rotationIndex);
  return [
    { row: cells[0].row, col: cells[0].col, letter: piece.letters[0] },
    { row: cells[1].row, col: cells[1].col, letter: piece.letters[1] },
  ];
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
