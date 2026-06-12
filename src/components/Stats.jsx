import React, { useState, useEffect, useRef } from 'react';
import { tickNumber } from '../tickAnimation';
import './Stats.css';

export function Stats({ gameState }) {
  const [displayWords, setDisplayWords] = useState(gameState.resources.words);
  const [displayMoney, setDisplayMoney] = useState(gameState.resources.money);
  /* Cancel handles: a superseded animation's watchdog must not snap the
     display to a stale toValue */
  const cancelWordsAnim = useRef(null);
  const cancelMoneyAnim = useRef(null);

  /* Animate word counter */
  useEffect(() => {
    if (displayWords !== gameState.resources.words) {
      cancelWordsAnim.current?.();
      cancelWordsAnim.current = tickNumber(displayWords, gameState.resources.words, 200, setDisplayWords);
    }
  }, [gameState.resources.words, displayWords]);

  /* Animate money counter */
  useEffect(() => {
    if (displayMoney !== gameState.resources.money) {
      cancelMoneyAnim.current?.();
      cancelMoneyAnim.current = tickNumber(displayMoney, gameState.resources.money, 200, setDisplayMoney);
    }
  }, [gameState.resources.money, displayMoney]);

  const totalMonkeys = gameState.upgrades.monkeys || 0;
  const shakespearePercent = Math.min(
    (gameState.anthology.totalWordsEver / 100000) * 100,
    100
  ).toFixed(2);

  return (
    <div className="stats-panel">
      <div className="stat">
        <label>WORDS</label>
        <span className="stat-value">{displayWords}</span>
      </div>

      <div className="stat">
        <label>MONEY</label>
        <span className="stat-value">${displayMoney}</span>
      </div>

      <div className="stat">
        <label>MONKEYS</label>
        <span className="stat-value">{totalMonkeys}</span>
      </div>

      <div className="stat full-width">
        <label>SHAKESPEARE</label>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${shakespearePercent}%` }}
          ></div>
          <span className="progress-text">{shakespearePercent}%</span>
        </div>
      </div>
    </div>
  );
}
