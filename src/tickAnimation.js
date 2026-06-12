/* Number tick animation: smoothly count from old to new value */

export function tickNumber(
  fromValue,
  toValue,
  duration = 200,
  onUpdate = () => {}
) {
  const startTime = Date.now();
  const diff = toValue - fromValue;

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out: feels snappy
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(fromValue + diff * eased);

    onUpdate(current);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
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
