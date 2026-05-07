import React from 'react';
import { GRID_WIDTH, GRID_HEIGHT, LETTUCE } from '../game/engine.js';

export default function GameGrid({ grid, currentPiece, paused }) {
  // Create display grid with current piece overlaid
  const displayGrid = grid.map(row => [...row]);
  if (currentPiece) {
    displayGrid[currentPiece.row][currentPiece.col] = currentPiece.letter;
  }

  return (
    <div className="game-grid">
      {displayGrid.map((row, rowIdx) => (
        <div key={rowIdx} className="grid-row">
          {row.map((cell, colIdx) => {
            const isCurrent = currentPiece &&
              currentPiece.row === rowIdx &&
              currentPiece.col === colIdx;
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
