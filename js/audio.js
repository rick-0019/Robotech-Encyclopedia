/**
 * Robotech Tactical HUD Audio Synthesizer (Web Audio API)
 * Genera efectos sonoros futuristas en tiempo real sin requerir archivos de audio externos.
 */
class TacticalAudio {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('robotech_sound_muted') === 'true';
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('robotech_sound_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.05, sweepTo = null) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (sweepTo) {
        osc.frequency.exponentialRampToValueAtTime(sweepTo, this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  click() {
    this.playTone(1200, 'square', 0.03, 0.02, 600);
  }

  hover() {
    this.playTone(880, 'sine', 0.02, 0.015);
  }

  scan() {
    this.playTone(400, 'sawtooth', 0.12, 0.03, 1400);
  }

  openDossier() {
    if (this.muted) return;
    this.playTone(520, 'triangle', 0.06, 0.03, 780);
    setTimeout(() => this.playTone(780, 'sine', 0.1, 0.04, 1040), 50);
  }

  addToCompare() {
    if (this.muted) return;
    this.playTone(650, 'sine', 0.06, 0.03);
    setTimeout(() => this.playTone(980, 'sine', 0.08, 0.04), 60);
  }

  alert() {
    if (this.muted) return;
    this.playTone(440, 'sawtooth', 0.15, 0.04);
    setTimeout(() => this.playTone(880, 'sawtooth', 0.15, 0.04), 120);
  }
}

window.tacticalAudio = new TacticalAudio();
