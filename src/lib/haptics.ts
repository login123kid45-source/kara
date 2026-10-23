/**
 * Tactile Haptic Feedback Engine for KARA
 * Combines Web Vibration API (navigator.vibrate) with a subtle Web Audio API
 * piezo-tactile micro-pulse so both mobile and desktop users feel tactile feedback
 * when sending messages, switching persona modes, or unlocking relationship tiers.
 */

export type HapticEventType = 'send' | 'modeSwitch' | 'unlock' | 'soap' | 'tap';

const HAPTIC_PATTERNS: Record<HapticEventType, number | number[]> = {
  tap: 10,
  send: [16, 28, 12],
  modeSwitch: [24, 36, 32],
  unlock: [18, 30, 24, 30, 45],
  soap: [35, 25, 35, 25, 35],
};

let audioCtx: AudioContext | null = null;

function playTactileActuatorPulse(type: HapticEventType) {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Low-frequency tactile thump frequencies modeled on linear resonant actuators (LRA)
    if (type === 'send') {
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.022);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);
    } else if (type === 'modeSwitch') {
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(175, now + 0.032);
      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    } else if (type === 'unlock') {
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.045);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    } else {
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.015);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
    }

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  } catch {
    // Ignore audio context restrictions if user hasn't interacted yet
  }
}

export function triggerHaptic(type: HapticEventType = 'tap', enabled = true): void {
  if (!enabled || typeof window === 'undefined') return;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(HAPTIC_PATTERNS[type] || 15);
    }
  } catch {}

  playTactileActuatorPulse(type);
}
