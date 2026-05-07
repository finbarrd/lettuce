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
  const [showHelp, setShowHelp] = useState(false);
  const [dictReady, setDictReady] = useState(false);
  const [scorePopups, setScorePopups] = useState([]);
  const gameRef = useRef(null);
  const dropTimerRef = useRef(null);
  const prevScoreRef = useRef(0);
  const prevWordsRef = useRef([]);

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
    setShowHelp(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setShowHelp(h => {
      if (!h) setPaused(true);
      return !h;
    });
  }, []);

  const instructions = (
    <div className="instructions">
      <h3>Controls</h3>
      <ul>
        <li><strong>← →</strong> Move letter left/right</li>
        <li><strong>↑</strong> Switch between consonant/vowel</li>
        <li><strong>↓</strong> Soft drop</li>
        <li><strong>Space</strong> Hard drop</li>
        <li><strong>Esc</strong> Pause/Resume</li>
      </ul>
      <h3>Rules</h3>
      <ul>
        <li>Each piece offers a <strong>consonant</strong> and a <strong>vowel</strong></li>
        <li>Form words <strong>horizontally</strong> or <strong>vertically</strong> (4+ letters)</li>
        <li>Score = sum of letter values × word length</li>
        <li><strong>🥬 Lettuce</strong> is a wildcard - type a letter to choose (one chance!)</li>
        <li>Get <strong>10 words</strong> to level up</li>
      </ul>
    </div>
  );

  // Detect new words and show score popups
  useEffect(() => {
    if (!gameState) return;
    const newWords = gameState.wordsFound;
    const prevWords = prevWordsRef.current;
    if (newWords.length > prevWords.length) {
      const scoreDelta = gameState.score - prevScoreRef.current;
      const addedWords = newWords.slice(prevWords.length);
      const popup = {
        id: Date.now(),
        points: scoreDelta,
        words: addedWords,
      };
      setScorePopups(prev => [...prev, popup]);
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popup.id));
      }, 1500);
    }
    prevScoreRef.current = gameState.score;
    prevWordsRef.current = newWords;
  }, [gameState?.score, gameState?.wordsFound]);

  const gameStateRef = useRef(null);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Game loop - auto drop on a fixed interval, independent of input
  useEffect(() => {
    if (!gameState || gameState.gameOver || !gameState.currentPiece || paused) return;

    const interval = gameState.dropInterval;
    dropTimerRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.gameOver || !prev.currentPiece) return prev;
        const next = dropPiece(prev);
        if (!next.currentPiece && !next.gameOver) {
          return spawnPiece(next);
        }
        return next;
      });
    }, interval);

    return () => clearInterval(dropTimerRef.current);
  }, [gameState?.gameOver, paused, !!gameState?.currentPiece, gameState?.dropInterval]);

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
          {instructions}
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
          {scorePopups.map(popup => (
            <div key={popup.id} className="score-popup">
              <div className="score-popup-words">{popup.words.join(', ')}</div>
              <div className="score-popup-points">+{popup.points}</div>
            </div>
          ))}
          {showHelp && (
            <div className="help-overlay">
              {instructions}
            </div>
          )}
        </div>
        <div className="sidebar">
          <div className="sidebar-buttons">
            <button className={`pause-btn ${paused ? 'paused-active' : ''}`} onClick={togglePause}>
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button className="pause-btn" onClick={toggleHelp}>
              {showHelp ? '✕ Close' : '? Help'}
            </button>
          </div>
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
