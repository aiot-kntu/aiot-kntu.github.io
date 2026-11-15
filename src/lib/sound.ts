/**
 * Ultra-lightweight mechanical micro-click sound generator using Web Audio API.
 * Zero external audio files required. Inspired by bencho.dev and kobra.systems.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = false;

if (typeof window !== 'undefined') {
  soundEnabled = localStorage.getItem('sound_fx') === 'true';
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('sound_fx', soundEnabled ? 'true' : 'false');
  }
  if (soundEnabled) {
    playTickSound();
  }
  return soundEnabled;
}

export function playTickSound(freq: number = 800, duration: number = 0.02) {
  if (!soundEnabled || typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    // Fail silently if audio context not allowed
  }
}
