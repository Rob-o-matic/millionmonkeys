import React from 'react';
import './StatusBox.css';

export function StatusBox({ events }) {
  const displayEvents = events.slice(-3);

  return (
    <div className="status-box">
      {displayEvents.length === 0 ? (
        <div className="status-line">Game initialized...</div>
      ) : (
        displayEvents.map((event, i) => (
          <div key={i} className={`status-line status-${event.type}`}>
            {event.message}
          </div>
        ))
      )}
    </div>
  );
}
