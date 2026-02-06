class SoundService {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize AudioContext lazily to handle browser autoplay policies
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }

  private getContext() {
    if (!this.audioContext) {
       try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
        }
      } catch (e) {
        return null;
      }
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().catch(err => console.debug('Audio resume failed', err));
    }
    return this.audioContext;
  }

  toggle(enabled: boolean) {
    this.enabled = enabled;
  }

  // Generic tone generator
  private playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, startTime: number = 0, volume: number = 0.1) {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  }

  playCreate() {
    // Rising major triad (C5 - E5 - G5)
    this.playTone(523.25, 'sine', 0.2, 0);
    this.playTone(659.25, 'sine', 0.2, 0.1);
    this.playTone(783.99, 'sine', 0.4, 0.2);
  }

  playJoin() {
    // Pleasant "Bloop" (rising)
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  playLeave() {
    // "Pop" or falling (falling)
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  playMessage() {
    // Gentle ping for chat
    this.playTone(1000, 'sine', 0.1, 0, 0.05);
  }
}

export const soundService = new SoundService();
