import React, { useState } from 'react';

function maskWord(text, word) {
  const stars = '*'.repeat(word.length);
  const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return text.replace(regex, stars);
}

export default function DefinitionChallenge({ challenge, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const handleChoice = (choice) => {
    if (revealed) return;
    setSelected(choice);
    setRevealed(true);
    const correct = choice === challenge.correctDefinition;
    // Brief delay to show result before continuing
    setTimeout(() => onAnswer(correct), 1200);
  };

  return (
    <div className="challenge-overlay">
      <div className="challenge-modal">
        <h2 className="challenge-word">{challenge.word}</h2>
        <p className="challenge-prompt">What does this word mean?</p>
        <div className="challenge-choices">
          {challenge.choices.map((choice, i) => {
            let className = 'challenge-choice';
            if (revealed) {
              if (choice === challenge.correctDefinition) {
                className += ' correct';
              } else if (choice === selected) {
                className += ' wrong';
              }
            } else if (choice === selected) {
              className += ' selected';
            }
            return (
              <button
                key={i}
                className={className}
                onClick={() => handleChoice(choice)}
                disabled={revealed}
              >
                {maskWord(choice, challenge.word)}
              </button>
            );
          })}
        </div>
        {revealed && (
          <p className="challenge-result">
            {selected === challenge.correctDefinition
              ? '✓ Correct! Points awarded.'
              : '✗ Wrong! No points this time.'}
          </p>
        )}
      </div>
    </div>
  );
}
