import React from 'react';
import './SectorChart.css';

const SECTORS = [
  { id: 'academic', name: 'Academic Publishing', color: '#3b82f6' },
  { id: 'blogs', name: 'Blog Networks', color: '#8b5cf6' },
  { id: 'social', name: 'Social Media', color: '#ec4899' },
  { id: 'news', name: 'News Media', color: '#f59e0b' },
  { id: 'books', name: 'Book Publishing', color: '#10b981' },
  { id: 'corporate', name: 'Corporate Communications', color: '#6366f1' },
  { id: 'government', name: 'Government Documents', color: '#ef4444' },
  { id: 'education', name: 'Educational Content', color: '#14b8a6' },
  { id: 'entertainment', name: 'Entertainment Media', color: '#f97316' },
];

export function SectorChart({ textShare, sectorsControlled, totalMonkeys }) {
  // Calculate share per sector (simplified model)
  const calculateSectorShare = (sectorId) => {
    const isControlled = sectorsControlled.includes(sectorId);
    if (isControlled) return 100;

    // Partial control based on overall text share
    const sectorIndex = SECTORS.findIndex(s => s.id === sectorId);
    const threshold = Math.pow(10, sectorIndex - 3); // 0.001%, 0.01%, 0.1%, 1%, etc.

    if (textShare >= threshold) {
      // Gradually taking over this sector
      const nextThreshold = Math.pow(10, sectorIndex - 2);
      const progress = (textShare - threshold) / (nextThreshold - threshold);
      return Math.min(progress * 100, 99);
    }

    return 0;
  };

  return (
    <div className="sector-chart">
      <div className="chart-header">
        <h2>TEXTUAL MARKET DOMINANCE</h2>
        <div className="chart-stats">
          <span className="stat">Global Share: {textShare.toFixed(3)}%</span>
          <span className="stat">Sectors: {sectorsControlled.length}/9</span>
          <span className="stat">Monkeys: {totalMonkeys.toLocaleString()}</span>
        </div>
      </div>

      <div className="sectors">
        {SECTORS.map(sector => {
          const share = calculateSectorShare(sector.id);
          const isControlled = sectorsControlled.includes(sector.id);

          return (
            <div key={sector.id} className={`sector ${isControlled ? 'controlled' : ''}`}>
              <div className="sector-info">
                <span className="sector-name">{sector.name}</span>
                <span className="sector-percent">{share.toFixed(1)}%</span>
              </div>
              <div className="sector-bar">
                <div
                  className="sector-fill"
                  style={{
                    width: `${share}%`,
                    backgroundColor: sector.color,
                    opacity: isControlled ? 1 : 0.6
                  }}
                />
              </div>
              {isControlled && <div className="sector-badge">CONTROLLED</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
