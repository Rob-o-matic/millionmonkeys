import React from 'react';
import { playPurchaseSound } from '../audio';
import './UpgradeButton.css';

const UPGRADE_DESCRIPTIONS = {
  monkeys: '+1 typist',
  habitat: '+10% breeding',
  caffeine: '+10% word detection',
  salesMonkey: 'Auto-sells every 5s',
};

export function UpgradeButton({
  upgradeKey,
  upgradeName,
  cost,
  canAfford,
  onClick,
  upgradeCount,
  showCount = true,
  description = null,
  money = 0,
  pulse = false,
}) {
  const handleClick = () => {
    if (canAfford) {
      playPurchaseSound();
      onClick();
    }
  };

  const desc = description || UPGRADE_DESCRIPTIONS[upgradeKey] || '';
  const progressPercent = Math.min(100, (money / cost) * 100);

  return (
    <button
      className={`upgrade-button ${canAfford ? 'affordable' : 'unaffordable'} ${pulse ? 'pulse' : ''}`}
      onClick={handleClick}
      disabled={!canAfford}
      title={`${upgradeName}${showCount ? ` (×${upgradeCount + 1})` : ''} - Cost: $${cost.toLocaleString()}`}
    >
      <span className="upgrade-name">{upgradeName}</span>
      {showCount && upgradeCount > 0 && <span className="upgrade-count">×{upgradeCount}</span>}
      <span className="upgrade-desc">{desc}</span>
      <span className="upgrade-cost">${cost.toLocaleString()}</span>
      {!canAfford && (
        <span
          className="upgrade-progress"
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
