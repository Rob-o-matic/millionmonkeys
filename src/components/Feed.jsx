import React, { useEffect, useRef, useState } from 'react';
import './Feed.css';

export function Feed({ gameState, startTime, totalMonkeys, onWordGenerated }) {
  const feedRef = useRef(null);
  const [textStream, setTextStream] = useState('');
  const [wordPool, setWordPool] = useState([]);
  const intervalRef = useRef(null);
  const recentlyHarvestedRef = useRef(new Set());

  /* Load dictionary on mount */
  useEffect(() => {
    fetch('/words.txt')
      .then(res => res.text())
      .then(text => {
        const words = text.trim().split('\n').filter(w => w.length > 0);
        setWordPool(words);
      })
      .catch(err => console.error('Failed to load dictionary:', err));
  }, []);

  /* Track recently harvested words (for green highlighting) */
  useEffect(() => {
    gameState.anthology.words.forEach((word) => {
      recentlyHarvestedRef.current.add(word.text.toLowerCase());
    });

    // Keep highlights for 10 seconds so we catch words in the stream
    const timer = setTimeout(() => {
      recentlyHarvestedRef.current.clear();
    }, 10000);

    return () => clearTimeout(timer);
  }, [gameState.anthology.words]);

  /* Generate word stream based on monkey count */
  useEffect(() => {
    if (!startTime || !totalMonkeys || wordPool.length === 0) return;

    // Base interval: 40ms per character
    // Scales dramatically with monkey count - becomes blur at high numbers
    const baseInterval = 40;
    let scaledInterval;

    if (totalMonkeys < 10) {
      scaledInterval = baseInterval / totalMonkeys; // Normal scaling
    } else if (totalMonkeys < 100) {
      scaledInterval = baseInterval / (totalMonkeys * 2); // 2x faster
    } else if (totalMonkeys < 1000) {
      scaledInterval = baseInterval / (totalMonkeys * 5); // 5x faster
    } else {
      scaledInterval = baseInterval / (totalMonkeys * 10); // 10x faster - total blur
    }

    scaledInterval = Math.max(scaledInterval, 1); // Min 1ms (maximum chaos)

    // Clear old interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTextStream((prev) => {
        const rand = Math.random();
        let text;

        if (rand > 0.97) {
          // 3% newline
          text = '\n';
        } else if (rand > 0.82) {
          // 15% space
          text = ' ';
        } else if (rand > 0.72) {
          // 10% real word from pool
          const word = wordPool[Math.floor(Math.random() * wordPool.length)];
          text = word + ' ';

          // Notify parent that a real word was generated
          if (onWordGenerated && Math.random() > 0.7) {
            // 30% chance to detect/harvest the word
            onWordGenerated(word);
          }
        } else {
          // 72% random letters (gibberish)
          const letters = 'abcdefghijklmnopqrstuvwxyz';
          text = letters[Math.floor(Math.random() * letters.length)];
        }

        return prev + text;
      });
    }, scaledInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, totalMonkeys, wordPool, onWordGenerated]);

  /* Auto-scroll to bottom */
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [textStream]);

  /* Render text with harvested words highlighted */
  const renderHighlightedText = () => {
    const hasMonkeys = totalMonkeys > 0;

    if (!textStream) {
      if (!hasMonkeys) {
        return <span className="placeholder">{">> Buy monkey to start."}</span>;
      } else {
        return <span className="placeholder">{">> Word detection engine......[idle]"}</span>;
      }
    }

    // Show running indicator when text is being generated
    const prefix = hasMonkeys
      ? '>> Word detection engine......[running]\n'
      : '>> Buy monkey to start.\n';

    const fullText = prefix + textStream;
    const lowerText = fullText.toLowerCase();

    const parts = [];
    let lastIndex = 0;

    // Find all harvested words and split text around them
    const harvestedArray = Array.from(recentlyHarvestedRef.current);
    const matches = [];

    harvestedArray.forEach((word) => {
      let idx = 0;
      while ((idx = lowerText.indexOf(word, idx)) !== -1) {
        matches.push({ start: idx, end: idx + word.length, word });
        idx += 1;
      }
    });

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Build parts with highlights
    matches.forEach((match) => {
      if (match.start > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="char">
            {fullText.substring(lastIndex, match.start)}
          </span>
        );
      }
      parts.push(
        <span key={`harvested-${match.start}`} className="char harvested">
          {fullText.substring(match.start, match.end)}
        </span>
      );
      lastIndex = match.end;
    });

    if (lastIndex < fullText.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="char">
          {fullText.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : textStream;
  };

  return (
    <div className={`feed ${totalMonkeys >= 100 ? 'blur-fast' : ''} ${totalMonkeys >= 1000 ? 'blur-extreme' : ''}`} ref={feedRef}>
      <div className="feed-text">{renderHighlightedText()}</div>
    </div>
  );
}


