// Global audio manager to persist audio across navigation
class AudioManager {
  private static instance: AudioManager;
  private clickSound: HTMLAudioElement | null = null;
  
  private constructor() {
    // Initialize click sound
    this.clickSound = new Audio("/constants/start.mp3");
    this.clickSound.volume = 1.0;
    this.clickSound.preload = "auto";
    this.clickSound.load();
  }
  
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  playClickSound(): void {
    if (this.clickSound) {
      // Clone the audio to allow overlapping plays if needed
      const audio = this.clickSound.cloneNode() as HTMLAudioElement;
      audio.volume = 1.0;
      audio.play().catch(err => console.error("Failed to play click sound:", err));
    }
  }
  
  // Play the original (for single instance)
  playClickSoundOnce(): void {
    if (this.clickSound) {
      // Reset to beginning if already playing
      this.clickSound.currentTime = 0;
      this.clickSound.volume = 0.8;
      this.clickSound.play().catch(err => console.error("Failed to play click sound:", err));
    }
  }
}

export default AudioManager.getInstance();