import React from 'react';
import { WORDS_PER_LEVEL, LETTUCE } from '../game/engine.js';

export default function ScoreBoard({ score, level, wordsFound, wordsThisLevel, nextPiece, paused }) {
  const recentWords = wordsFound.slice(-8).reverse();

  return (
    <div className="score-board">
      <div className="next-piece-section">
        <h2>Next</h2>
        {paused ? (
          <div className="next-piece-pair">
            <div className="next-piece-preview masked">🥬</div>
            <div className="next-piece-preview masked">🥬</div>
          </div>
        ) : nextPiece?.isLettuce ? (
          <div className="next-piece-pair">
            <div className="next-piece-preview lettuce">{LETTUCE}</div>
          </div>
        ) : nextPiece?.pair ? (
          <div className="next-piece-pair">
            <div className="next-piece-preview">{nextPiece.pair.left}</div>
            <div className="next-piece-preview">{nextPiece.pair.right}</div>
          </div>
        ) : (
          <div className="next-piece-pair">
            <div className="next-piece-preview">{nextPiece?.letter || '?'}</div>
          </div>
        )}
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
