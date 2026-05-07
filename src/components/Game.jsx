import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameGrid from './GameGrid.jsx';
import ScoreBoard from './ScoreBoard.jsx';
import {
  createGameState,
  spawnPiece,
  movePiece,
  dropPiece,
  hardDrop,
  chooseLettuceLetter,
  switchLetter,
  LETTUCE,
} from '../game/engine.js';
import { initDictionary } from '../game/dictionary.js';

export default function Game() {
  const [gameState, setGameState] = useState(null);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dictReady, setDictReady] = useState(false);
  const gameRef = useRef(null);
  const dropTimerRef = useRef(null);

  // Load dictionary on mount
  useEffect(() => {
    initDictionary().then(() => setDictReady(true));
  }, []);

  // Start a new game
  const startGame = useCallback(() => {
    const state = createGameState();
    const withPiece = spawnPiece(state);
    setGameState(withPiece);
    setStarted(true);
    setPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    setPaused(p => !p);
  }, []);

  // Game loop - auto drop
  useEffect(() => {
    if (!gameState || gameState.gameOver || !gameState.currentPiece || paused) return;

    dropTimerRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.gameOver) return prev;
        const next = dropPiece(prev);
        // If piece was locked (no currentPiece), spawn new one
        if (!next.currentPiece && !next.gameOver) {
          return spawnPiece(next);
        }
        return next;
      });
    }, gameState.dropInterval);

    return () => clearInterval(dropTimerRef.current);
  }, [gameState?.dropInterval, gameState?.currentPiece, gameState?.gameOver, paused]);

  // Keyboard controls
  useEffect(() => {
    if (!started || !gameState || gameState.gameOver) return;

    const handleKey = (e) => {
      // Escape toggles pause
      if (e.key === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
      }

      // Block all game input while paused
      if (paused) return;

      // If current piece is a lettuce wildcard awaiting letter choice,
      // handle A-Z key presses (one chance only)
      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        setGameState(prev => {
          if (!prev?.currentPiece?.isLettuce || prev.currentPiece.letterChosen) return prev;
          return chooseLettuceLetter(prev, e.key);
        });
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setGameState(prev => movePiece(prev, -1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setGameState(prev => movePiece(prev, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setGameState(prev => switchLetter(prev));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setGameState(prev => {
            const next = dropPiece(prev);
            if (!next.currentPiece && !next.gameOver) {
              return spawnPiece(next);
            }
            return next;
          });
          break;
        case ' ':
          e.preventDefault();
          setGameState(prev => {
            const next = hardDrop(prev);
            if (!next.currentPiece && !next.gameOver) {
              return spawnPiece(next);
            }
            return next;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, gameState?.gameOver, paused, togglePause]);

  if (!dictReady) {
    return <div className="game-container loading">Loading dictionary...</div>;
  }

  if (!started) {
    return (
      <div className="game-container menu">
        <div className="title-screen">
          <h1 className="game-title">🥬 Lettuce</h1>
          <p className="game-subtitle">A word-building falling letter game</p>
          <div className="instructions">
            <h3>How to Play</h3>
            <ul>
              <li><strong>← →</strong> Move letter left/right</li>
              <li><strong>↑</strong> Switch between consonant/vowel</li>
              <li><strong>↓</strong> Soft drop</li>
              <li><strong>Space</strong> Hard drop</li>
              <li><strong>🥬 Lettuce</strong> Type a letter to choose (one chance!)</li>
              <li>Form words <strong>horizontally</strong> or <strong>vertically</strong></li>
              <li>Words must be <strong>4+ letters</strong></li>
              <li>Longer and rarer words score more!</li>
            </ul>
          </div>
          <button className="start-btn" onClick={startGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState?.gameOver) {
    return (
      <div className="game-container game-over">
        <div className="game-over-screen">
          <h1>Game Over!</h1>
          <p className="final-score">Final Score: <strong>{gameState.score}</strong></p>
          <p className="words-made">Words Made: <strong>{gameState.wordsFound.length}</strong></p>
          {gameState.wordsFound.length > 0 && (
            <div className="best-words">
              <h3>Your Words:</h3>
              <div className="word-chips">
                {gameState.wordsFound.map((w, i) => (
                  <span key={i} className="word-chip">{w}</span>
                ))}
              </div>
            </div>
          )}
          <button className="start-btn" onClick={startGame}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container playing" ref={gameRef}>
      <div className="game-layout">
        <div className="grid-wrapper">
          <GameGrid grid={gameState.grid} currentPiece={gameState.currentPiece} paused={paused} />
        </div>
        <div className="sidebar">
          <button className={`pause-btn ${paused ? 'paused-active' : ''}`} onClick={togglePause}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <ScoreBoard
            score={gameState.score}
            level={gameState.level}
            wordsFound={gameState.wordsFound}
            wordsThisLevel={gameState.wordsThisLevel}
            nextPiece={gameState.nextPiece}
            paused={paused}
          />
        </div>
      </div>
    </div>
  );
}
