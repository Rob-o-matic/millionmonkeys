import React, { useEffect, useRef, useState } from 'react';
import { getGraceWindow } from '../scheduler';
import './Feed.css';

/* Sentinel markers used to embed injected (scripted) gems in the text stream.
   Format: GEM_START + flag + text + GEM_END, flag: '1' tier 1, '2' tier 2+, 'N' near-miss */
const GEM_START = String.fromCharCode(1);
const GEM_END = String.fromCharCode(2);
const GEM_REGEX = new RegExp(`${GEM_START}([12N])([^${GEM_END}]*)${GEM_END}`, 'g');

/* Cap the stream length: it is re-tokenized and re-rendered every tick, so
   an unbounded buffer silently throttles the whole app (and with it, word
   detection income) as a session ages */
const STREAM_MAX = 6000;
const STREAM_KEEP = 5000;

function trimStream(stream) {
  if (stream.length <= STREAM_MAX) return stream;
  let trimmed = stream.slice(-STREAM_KEEP);
  // Don't strand a gem tail: if a GEM_END appears before any GEM_START,
  // the cut landed inside a gem - drop through the orphaned end marker
  const firstEnd = trimmed.indexOf(GEM_END);
  if (firstEnd !== -1) {
    const firstStart = trimmed.indexOf(GEM_START);
    if (firstStart === -1 || firstEnd < firstStart) {
      trimmed = trimmed.slice(firstEnd + 1);
    }
  }
  return trimmed;
}

export function Feed({
  gameState,
  startTime,
  totalMonkeys,
  injectedGem = null,
}) {
  const feedRef = useRef(null);
  const [textStream, setTextStream] = useState('');
  const [wordPool, setWordPool] = useState([]);
  const intervalRef = useRef(null);
  const pausedRef = useRef(false);
  /* Map of word -> highlight expiry timestamp (per-word grace window) */
  const recentlyHarvestedRef = useRef(new Map());

  /* Load dictionary on mount */
  useEffect(() => {
    fetch('/words.txt')
      .then(res => res.text())
      .then(text => {
        const words = text.split(/\r?\n/).map(w => w.trim()).filter(w => w.length > 0);
        setWordPool(words);
      })
      .catch(err => console.error('Failed to load dictionary:', err));
  }, []);

  /* Track recently harvested words (for green highlighting).
     Each word expires individually after its tier's grace window. */
  useEffect(() => {
    const now = Date.now();
    gameState.anthology.words.forEach((word) => {
      const expires = word.timestamp + getGraceWindow(word.tier);
      if (expires > now) {
        recentlyHarvestedRef.current.set(word.text.toLowerCase(), expires);
      }
    });
  }, [gameState.anthology.words]);

  /* Inject scripted gems / near-misses into the visible stream:
     pause the gibberish briefly, then append the gem text. */
  useEffect(() => {
    if (!injectedGem || !injectedGem.text) return;

    pausedRef.current = true;
    const flag = injectedGem.isNearMiss ? 'N' : (injectedGem.tier >= 2 ? '2' : '1');

    const timer = setTimeout(() => {
      setTextStream(prev => `${prev} ${GEM_START}${flag}${injectedGem.text}${GEM_END} `);
      pausedRef.current = false;
    }, 400);

    return () => {
      clearTimeout(timer);
      pausedRef.current = false;
    };
  }, [injectedGem]);

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
      if (pausedRef.current) return; // Paused while an injected gem lands

      // Generate OUTSIDE the state updater: updaters run during render,
      // and side effects from inside one are a React error
      const rand = Math.random();
      let text;

      if (rand > 0.97) {
        // 3% newline
        text = '\n';
      } else if (rand > 0.82) {
        // 15% space
        text = ' ';
      } else if (rand > 0.72) {
        // 10% real word from pool. PURE COSMETICS: detection income comes
        // from the fixed-timestep accumulator in App.jsx (getDetectionsPerSecond),
        // never from this render-coupled tick.
        const word = wordPool[Math.floor(Math.random() * wordPool.length)];
        text = word + ' ';
      } else {
        // 72% random letters (gibberish)
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        text = letters[Math.floor(Math.random() * letters.length)];
      }

      setTextStream((prev) => trimStream(prev + text));
    }, scaledInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, totalMonkeys, wordPool]);

  /* Auto-scroll to bottom */
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [textStream]);

  /* Render a plain (non-injected) segment, highlighting whole tokens only */
  const renderPlainSegment = (text, keyPrefix, activeWords) => {
    const parts = [];
    const tokens = text.split(/(\s+)/);
    let buffer = '';
    let bufferStart = 0;
    let pos = 0;

    const flushBuffer = () => {
      if (buffer) {
        parts.push(
          <span key={`${keyPrefix}-t-${bufferStart}`} className="char">
            {buffer}
          </span>
        );
        buffer = '';
      }
    };

    tokens.forEach((token) => {
      if (token && !/^\s+$/.test(token) && activeWords.has(token.toLowerCase())) {
        flushBuffer();
        parts.push(
          <span key={`${keyPrefix}-h-${pos}`} className="char harvested">
            {token}
          </span>
        );
      } else {
        if (!buffer) bufferStart = pos;
        buffer += token;
      }
      pos += token.length;
    });
    flushBuffer();

    return parts;
  };

  /* Render text with harvested words and injected gems highlighted */
  const renderHighlightedText = () => {
    const hasMonkeys = totalMonkeys > 0;

    if (!textStream) {
      if (!hasMonkeys) {
        return <span className="placeholder">{">> Hire your first monkey below."}</span>;
      } else {
        return <span className="placeholder">{">> Word detection engine......[idle]"}</span>;
      }
    }

    // Show running indicator when text is being generated
    const prefix = hasMonkeys
      ? '>> Word detection engine......[running]\n'
      : '>> Hire your first monkey below.\n';

    const fullText = prefix + textStream;

    // Expire stale highlights individually
    const now = Date.now();
    recentlyHarvestedRef.current.forEach((expires, word) => {
      if (expires <= now) recentlyHarvestedRef.current.delete(word);
    });
    const activeWords = recentlyHarvestedRef.current;

    const parts = [];
    let lastIndex = 0;
    let match;
    GEM_REGEX.lastIndex = 0;

    while ((match = GEM_REGEX.exec(fullText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          ...renderPlainSegment(fullText.substring(lastIndex, match.index), `p-${lastIndex}`, activeWords)
        );
      }

      const flag = match[1];
      const gemText = match[2];

      if (flag === 'N') {
        // Near-miss: amber background, final wrong character in red
        parts.push(
          <span key={`nm-${match.index}`} className="char near-miss">
            {gemText.slice(0, -1)}
            <span className="near-miss-final">{gemText.slice(-1)}</span>
          </span>
        );
      } else {
        parts.push(
          <span
            key={`gem-${match.index}`}
            className={`char harvested${flag === '2' ? ' tier2' : ''}`}
          >
            {gemText}
          </span>
        );
      }

      lastIndex = GEM_REGEX.lastIndex;
    }

    if (lastIndex < fullText.length) {
      parts.push(
        ...renderPlainSegment(fullText.substring(lastIndex), `p-${lastIndex}`, activeWords)
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
