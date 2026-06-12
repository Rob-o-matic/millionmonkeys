/* Audio system: Web Audio API for non-blocking sound */

let audioContext = null;
let audioEnabled = true;

function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  return audioContext;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  if (!audioEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = frequency;
    osc.type = type;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    // Audio context error, silently fail
  }
}

export function playDing(tier) {
  if (!audioEnabled) return;

  switch (tier) {
    case 1:
      // Low ding: 200ms, 261.63Hz (C4)
      playTone(261.63, 200, 'sine', 0.3);
      break;
    case 2:
      // Chime: 300ms, 391.99Hz (G4)
      playTone(391.99, 300, 'sine', 0.3);
      break;
    case 3:
      // Fanfare: three tones in sequence
      playTone(261.63, 150, 'sine', 0.2); // C4
      setTimeout(() => playTone(329.63, 150, 'sine', 0.2), 150); // E4
      setTimeout(() => playTone(391.99, 200, 'sine', 0.2), 300); // G4
      break;
    case 4:
      // Anomaly: high pitch, 400ms
      playTone(523.25, 400, 'sine', 0.25); // C5
      break;
    case 5:
      // Shakespeare: long, majestic tone
      playTone(261.63, 1000, 'sine', 0.2); // C4, long
      break;
    default:
      playTone(200, 100, 'sine', 0.2);
  }
}

export function playNearMissSound() {
  if (!audioEnabled) return;
  // Soft "aww" sound: 100ms, low frequency
  playTone(150, 100, 'sine', 0.15);
}

export function playPurchaseSound() {
  if (!audioEnabled) return;
  // Bell tone: 400ms, brass frequency
  playTone(440, 400, 'sine', 0.3);
}

export function playSellSound() {
  if (!audioEnabled) return;
  // Distinct two-note "cha-ching" (rising): A4 then D5
  playTone(440, 120, 'sine', 0.25);
  setTimeout(() => playTone(587.33, 200, 'sine', 0.25), 110);
}

export function setAudioEnabled(enabled) {
  audioEnabled = enabled;
}

export function isAudioEnabled() {
  return audioEnabled;
}

export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

/* Typing ambience - soft ASMR keyboard sounds */
let typingInterval = null;

export function startTypingAmbience(monkeyCount) {
  if (!audioEnabled || monkeyCount === 0) return;

  // Stop existing ambience
  if (typingInterval) clearInterval(typingInterval);

  const ctx = getAudioContext();
  if (!ctx) return;

  // Calculate typing frequency based on monkey count
  // More monkeys = more frequent keystrokes (like rain intensity)
  const baseInterval = 100; // ms between sounds
  const interval = Math.max(baseInterval / Math.log10(monkeyCount + 10), 20);

  typingInterval = setInterval(() => {
    if (!audioEnabled) return;

    try {
      // Create soft keyboard click sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      // Random frequency for variety (like different keys)
      const baseFreq = 800 + Math.random() * 400; // 800-1200Hz
      osc.frequency.value = baseFreq;
      osc.type = 'triangle';

      // Low-pass filter for softness
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;

      // Very quiet, short envelope
      const volume = 0.015 + Math.random() * 0.01; // 0.015-0.025
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      const now = ctx.currentTime;
      osc.start(now);
      osc.stop(now + 0.05); // 50ms keystroke
    } catch (e) {
      // Silently handle audio errors
    }
  }, interval);
}

export function stopTypingAmbience() {
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
}
