import React from 'react';
import { WORDS_PER_LEVEL, LETTUCE } from '../game/engine.js';

export default function ScoreBoard({ score, level, wordsFound, wordsThisLevel, nextPiece, paused }) {
  const recentWords = wordsFound.slice(-8).reverse();

  const renderNextPiece = () => {
    if (paused) {
      return (
        <div className="next-piece-pair">
          <div className="next-piece-preview masked">🥬</div>
        </div>
      );
    }

    if (!nextPiece) {
      return (
        <div className="next-piece-pair">
          <div className="next-piece-preview">?</div>
        </div>
      );
    }

    if (nextPiece.type === 'single') {
      return (
        <div className="next-piece-pair">
          <div className={`next-piece-preview ${nextPiece.isLettuce ? 'lettuce' : ''}`}>
            {nextPiece.isLettuce ? LETTUCE : nextPiece.letter}
          </div>
        </div>
      );
    }

    // Pair piece - use getPairCells-equivalent logic to show correct layout
    // States 0,2 are horizontal, states 1,3 are vertical
    const isVertical = nextPiece.rotationIndex === 1 || nextPiece.rotationIndex === 3;
    // For preview, show letters in their visual positions
    // State 0: [0] left [1] right | State 1: [1] top [0] bottom
    // State 2: [1] left [0] right | State 3: [0] top [1] bottom
    let first, second;
    if (nextPiece.rotationIndex === 0) {
      [first, second] = nextPiece.letters;
    } else if (nextPiece.rotationIndex === 1) {
      [first, second] = [nextPiece.letters[1], nextPiece.letters[0]];
    } else if (nextPiece.rotationIndex === 2) {
      [first, second] = [nextPiece.letters[1], nextPiece.letters[0]];
    } else {
      [first, second] = nextPiece.letters;
    }

    return (
      <div className={`next-piece-pair ${isVertical ? 'vertical' : 'horizontal'}`}>
        <div className="next-piece-preview pair-tile">{first}</div>
        <div className="next-piece-preview pair-tile">{second}</div>
      </div>
    );
  };

  return (
    <div className="score-board">
      <div className="next-piece-section">
        <h2>Next</h2>
        {renderNextPiece()}
      </div>
      <div className="score-section">
        <h2>Score</h2>
        <div className="score-value">{score}</div>
      </div>
      <div className="level-section">
        <h2>Level {level}</h2>
        <div className="level-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(wordsThisLevel / WORDS_PER_LEVEL) * 100}%` }}
            />
          </div>
          <div className="progress-label">{wordsThisLevel}/{WORDS_PER_LEVEL} words</div>
        </div>
      </div>
      <div className="words-section">
        <h2>Words Found</h2>
        <div className="words-count">{wordsFound.length} total</div>
        <ul className="words-list">
          {recentWords.map((word, i) => (
            <li key={i} className="word-item">{word}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
