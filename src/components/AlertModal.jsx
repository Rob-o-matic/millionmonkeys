import React from 'react';
import './AlertModal.css';

export function AlertModal({ alert, onDismiss }) {
  if (!alert) return null;

  return (
    <div className="alert-overlay">
      <div className={`alert-modal ${alert.type}`}>
        <div className="alert-icon">{alert.icon}</div>
        <h2 className="alert-title">{alert.title}</h2>
        <div className="alert-message">{alert.message}</div>
        {alert.details && (
          <div className="alert-details">{alert.details}</div>
        )}
        <button className="alert-button" onClick={onDismiss}>
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
}
