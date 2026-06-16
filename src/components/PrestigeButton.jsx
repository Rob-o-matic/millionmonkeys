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
          ? 'Confirm — Submit to Institute? (click again)'
          : `\u{1F4D6} Submit Volume to I.I.L. (${collectedCount} phrases)`}
      </button>
      {armed && (
        <div className="prestige-warning">
          Flagged phrases are submitted for publication. You keep playing. +$500 publisher's advance.
        </div>
      )}
    </div>
  );
}
