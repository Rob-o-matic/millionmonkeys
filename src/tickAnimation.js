/* Number tick animation: smoothly count from old to new value */

export function tickNumber(
  fromValue,
  toValue,
  duration = 200,
  onUpdate = () => {}
) {
  /* Hidden tabs never get rAF frames: show the truth instantly, no animation
     (a frozen MONEY counter reads as a money-not-deducted bug) */
  if (typeof document !== 'undefined' && document.hidden) {
    onUpdate(toValue);
    return () => {};
  }

  const startTime = Date.now();
  const diff = toValue - fromValue;
  let cancelled = false;

  /* Watchdog: if rAF is throttled/occluded mid-animation, guarantee the
     final value lands anyway (~duration+150ms foreground, ~1s background
     under browser timer clamping) */
  const snapTimer = setTimeout(() => {
    if (!cancelled) {
      cancelled = true;
      onUpdate(toValue);
    }
  }, duration + 150);

  function animate() {
    if (cancelled) return;

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out: feels snappy. Progress is wall-clock based, so when rAF
    // resumes after a long stall the first frame snaps to toValue.
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(fromValue + diff * eased);

    onUpdate(current);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      cancelled = true;
      clearTimeout(snapTimer);
    }
  }

  animate();

  /* Cancel function: callers starting a newer animation must cancel the old
     one so its watchdog can't snap the display to a stale toValue */
  return () => {
    cancelled = true;
    clearTimeout(snapTimer);
  };
}

/* Debounce rapid ticks to prevent jank */
export function createTickDebouncer(threshold = 3) {
  let recentTicks = [];

  return function shouldTick() {
    const now = Date.now();
    recentTicks = recentTicks.filter((t) => now - t < 1000); // 1s window

    if (recentTicks.length < threshold) {
      recentTicks.push(now);
      return true;
    }

    return false;
  };
}
