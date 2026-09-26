// Gentle ambient audio synthesizer using Web Audio API (no external asset needed)

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.scheduleChimes();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }

  private scheduleChimes() {
    if (!this.isPlaying || !this.ctx) return;

    // Pentatonic scale frequencies for a peaceful zen garden chime
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = notes[Math.floor(Math.random() * notes.length)];
    this.playChime(freq);

    const nextDelay = 2200 + Math.random() * 3500;
    this.timer = window.setTimeout(() => this.scheduleChimes(), nextDelay);
  }

  private playChime(freq: number) {
    if (!this.ctx || this.ctx.state !== "running") return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Natural bell/chime envelope
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 2.5);
  }
}

export const ambientAudio = new AmbientAudioEngine();
