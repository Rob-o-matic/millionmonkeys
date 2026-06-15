import React from 'react';
import './StatusBox.css';

export function StatusBox({ events, pinnedAlert }) {
  const displayEvents = events.slice(-7);

  return (
    <div className="status-box">
      {pinnedAlert && (
        <div className={`status-pinned status-${pinnedAlert.type}`}>
          {pinnedAlert.message}
        </div>
      )}
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
