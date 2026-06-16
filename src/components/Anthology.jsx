import React, { useState } from 'react';
import './Anthology.css';

export function Anthology({ collected }) {
  const [open, setOpen] = useState(false);

  if (!collected || collected.length === 0) return null;

  const volumes = Math.floor(collected.length / 10);
  const reversed = [...collected].reverse();

  return (
    <div className="anthology">
      <button
        className="anthology-header"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls="anthology-list"
      >
        <span>
          {'\u{1F4D6}'} I.I.L. Research Archive
          {' • '}{collected.length} flagged
          {volumes > 0 && ` • ${volumes} ${volumes === 1 ? 'volume' : 'volumes'} submitted`}
        </span>
        <span className="anthology-header-toggle" aria-hidden="true">
          {open ? '[▲]' : '[▼]'}
        </span>
      </button>
      {open && (
        <ul className="anthology-list" id="anthology-list">
          {reversed.map((entry, i) => (
            <li key={i} className="anthology-entry">
              <span
                className={
                  'anthology-entry-text' +
                  (entry.tier >= 4 ? ' anthology-entry-text--tier4' : '')
                }
              >
                &ldquo;{entry.text}&rdquo;
              </span>
              <span className="anthology-entry-label">
                {entry.tier >= 4 ? 'anomaly' : 'phrase'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
