// Gentle waiting & ambient audio player for official.id
// Uses /song/The_Green_Light.mp3 with autoplay permission handling

class AmbientAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;

  private init() {
    if (!this.audio && typeof window !== "undefined") {
      this.audio = new Audio("/song/The_Green_Light.mp3");
      this.audio.preload = "auto";
      this.audio.loop = true;
      this.audio.volume = 0.55;
    }
  }

  public async start(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    this.init();
    if (!this.audio) return false;

    try {
      await this.audio.play();
      this.isPlaying = true;
      return true;
    } catch (err) {
      console.warn("Autoplay audio blocked or pending user gesture:", err);
      this.isPlaying = false;
      return false;
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.audio) {
      try {
        this.audio.pause();
      } catch {
        /* ignore */
      }
    }
  }

  public async resume(): Promise<boolean> {
    return this.start();
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start().then((ok) => {
        this.isPlaying = ok;
      });
      this.isPlaying = true;
      return true;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const ambientAudio = new AmbientAudioEngine();
