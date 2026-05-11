import React from 'react';
import { GRID_WIDTH, GRID_HEIGHT, LETTUCE, getCurrentPieceCells } from '../game/engine.js';

export default function GameGrid({ grid, currentPiece, paused }) {
  // Create display grid with current piece overlaid
  const displayGrid = grid.map(row => [...row]);
  const pieceCells = getCurrentPieceCells(currentPiece);
  const pieceCellSet = new Set();
  for (const cell of pieceCells) {
    displayGrid[cell.row][cell.col] = cell.letter;
    pieceCellSet.add(`${cell.row},${cell.col}`);
  }

  return (
    <div className="game-grid">
      {displayGrid.map((row, rowIdx) => (
        <div key={rowIdx} className="grid-row">
          {row.map((cell, colIdx) => {
            const isCurrent = pieceCellSet.has(`${rowIdx},${colIdx}`);
            const showAsLettuce = paused && cell;
            const isLettuceCell = !paused && cell === LETTUCE;
            const displayChar = showAsLettuce ? '🥬' : (cell || '');
            return (
              <div
                key={colIdx}
                className={`grid-cell ${cell ? 'filled' : 'empty'} ${isCurrent && !paused ? 'current' : ''} ${isLettuceCell ? 'lettuce' : ''} ${showAsLettuce ? 'masked' : ''}`}
              >
                {displayChar}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
