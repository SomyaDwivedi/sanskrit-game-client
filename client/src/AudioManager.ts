class AudioManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private bgMusic: HTMLAudioElement | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize sound effects with base64 encoded audio
    this.sounds = {
      correct: this.createAudio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEASCcAAEgnAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSx9y+/fkTkI'),
      wrong: this.createAudio('data:audio/wav;base64,UklGRjQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAFAAB/f39/f39/f4CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgH9/f39/f39/'),
      buzz: this.createAudio('data:audio/wav;base64,UklGRl4FAABXQVZFZm10IBAAAAABAAEASCcAAEgnAAABAAgAZGF0YToFAAB/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+A'),
      applause: this.createAudio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAMB+AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH')
    };

    // Initialize background music (you can replace with actual music URL)
    this.bgMusic = this.createAudio('');
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.1;
  }

  private createAudio(src: string): HTMLAudioElement {
    const audio = new Audio(src);
    audio.volume = 0.3;
    return audio;
  }

  playSound(soundName: string) {
    if (this.enabled && this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch(() => {});
    }
  }

  toggleSound(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled && this.bgMusic) {
      this.bgMusic.pause();
    } else if (this.enabled && this.bgMusic && this.bgMusic.src) {
      this.bgMusic.play().catch(() => {});
    }
    return this.enabled;
  }

  startBgMusic() {
    if (this.enabled && this.bgMusic && this.bgMusic.src) {
      this.bgMusic.play().catch(() => {});
    }
  }

  stopBgMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }
}

export default AudioManager;
