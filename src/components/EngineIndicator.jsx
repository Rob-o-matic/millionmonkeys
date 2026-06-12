import React from 'react';
import './EngineIndicator.css';

export function EngineIndicator({ gameStarted, totalMonkeys, wordsDiscovered, elapsedSeconds }) {
  const isRunning = gameStarted && totalMonkeys > 0;

  return (
    <div className={`engine-indicator ${isRunning ? 'running' : 'idle'}`}>
      <div className="indicator-pulse"></div>
      <span className="indicator-text">
        {isRunning ? '◆ ENGINE ACTIVE' : '○ ENGINE IDLE'}
      </span>
      <span className="indicator-stats">
        {totalMonkeys} monkeys | {wordsDiscovered} words | {elapsedSeconds}s
      </span>
    </div>
  );
}
