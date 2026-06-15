import React, { useState, useRef } from 'react';
import './PrestigeButton.css';

export function PrestigeButton({ collectedCount, onPrestige }) {
  const [armed, setArmed] = useState(false);
  const disarmTimerRef = useRef(null);

  const handleClick = () => {
    if (armed) {
      // Second click — confirm prestige
      if (disarmTimerRef.current) {
        clearTimeout(disarmTimerRef.current);
        disarmTimerRef.current = null;
      }
      setArmed(false);
      onPrestige();
    } else {
      // First click — arm with 5s auto-disarm
      setArmed(true);
      disarmTimerRef.current = setTimeout(() => {
        setArmed(false);
        disarmTimerRef.current = null;
      }, 5000);
    }
  };

  return (
    <div className="prestige-area">
      <button
        className={`prestige-btn${armed ? ' armed' : ''}`}
        onClick={handleClick}
      >
        {armed
          ? 'Confirm — Publish Volume? (click again)'
          : `\u{1F4D6} Publish a Volume (${collectedCount} phrases collected)`}
      </button>
      {armed && (
        <div className="prestige-warning">
          This will reset the game. Anthology and tenure monkeys are kept.
        </div>
      )}
    </div>
  );
}
