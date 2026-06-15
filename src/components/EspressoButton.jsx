import React, { useState, useEffect } from 'react';
import './EspressoButton.css';

export function EspressoButton({ available, active, endTime, onPress }) {
  const [countdown, setCountdown] = useState(null);

  /* Live countdown while burst is active */
  useEffect(() => {
    if (!active) {
      setCountdown(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [active, endTime]);

  if (!available && !active) return null;

  const cls = [
    'espresso-btn',
    available && !active ? 'espresso-available' : '',
    active ? 'espresso-active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} onClick={onPress} aria-label="Espresso Shot">
      {active ? (
        <>
          <span className="espresso-btn__label">☕ 3x BURST</span>
          <span className="espresso-btn__countdown">
            {countdown}s remaining (tap to extend)
          </span>
        </>
      ) : (
        <span className="espresso-btn__label">☕ A monkey needs a pick-me-up!</span>
      )}
    </button>
  );
}
