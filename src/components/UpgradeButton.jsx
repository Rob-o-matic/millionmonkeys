import React from 'react';
import { playPurchaseSound } from '../audio';
import './UpgradeButton.css';

const UPGRADE_DESCRIPTIONS = {
  monkeys: 'Types words',
  habitat: 'Faster breeding',
  caffeine: '1.1x boost',
  salesMonkey: 'Auto-sells',
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
}) {
  const handleClick = () => {
    if (canAfford) {
      playPurchaseSound();
      onClick();
    }
  };

  const desc = description || UPGRADE_DESCRIPTIONS[upgradeKey] || '';

  return (
    <button
      className={`upgrade-button ${canAfford ? 'affordable' : 'unaffordable'}`}
      onClick={handleClick}
      disabled={!canAfford}
      title={`${upgradeName}${showCount ? ` (×${upgradeCount + 1})` : ''} - Cost: $${cost.toLocaleString()}`}
    >
      <span className="upgrade-name">{upgradeName}</span>
      {showCount && upgradeCount > 0 && <span className="upgrade-count">×{upgradeCount}</span>}
      <span className="upgrade-desc">{desc}</span>
      <span className="upgrade-cost">${cost.toLocaleString()}</span>
    </button>
  );
}

