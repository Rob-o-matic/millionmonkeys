import React, { useState, useEffect } from 'react';
import { CAFFEINE_DIAL_STOPS } from '../scheduler';
import './CaffeineDial.css';

export function CaffeineDial({ stop, metabolizing, metabolizeEnd, dozing, onSelect }) {
  const [countdown, setCountdown] = useState(null);

  /* Live countdown while metabolizing */
  useEffect(() => {
    if (!metabolizing || metabolizeEnd == null) {
      setCountdown(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((metabolizeEnd - Date.now()) / 1000));
      setCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [metabolizing, metabolizeEnd]);

  const locked = metabolizing || dozing;

  let statusText = '';
  if (dozing) {
    statusText = '(Decaf — dozing)';
  } else if (metabolizing && countdown !== null) {
    statusText = `Metabolizing ${countdown}s…`;
  }

  return (
    <div className="caffeine-dial">
      <span className="caffeine-dial__label">Caffeination Dial</span>
      {statusText && <span className="caffeine-dial__status">{statusText}</span>}
      <div className="caffeine-dial__stops">
        {CAFFEINE_DIAL_STOPS.map((dialStop, index) => {
          const isActive = !dozing && stop === index;
          return (
            <button
              key={index}
              className={`caffeine-dial__stop${isActive ? ' caffeine-dial__stop--active' : ''}`}
              disabled={locked}
              onClick={() => onSelect(index)}
              title={dialStop.label}
            >
              {dialStop.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
