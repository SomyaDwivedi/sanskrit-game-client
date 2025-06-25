// AudioManager.ts - Handles all game sounds

class AudioManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private bgMusic: HTMLAudioElement | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize sound effects with better sounds
    this.sounds = {
      // Buzzer system sounds
      buzzerOpen: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2865/2865-preview.mp3"
      ),
      buzz: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3"
      ),
      teamBuzz: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
      ),
      otherBuzz: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/1626/1626-preview.mp3"
      ),
      secondChance: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/146/146-preview.mp3"
      ),

      // Answer result sounds
      correct: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"
      ),
      otherCorrect: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/957/957-preview.mp3"
      ),
      wrong: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2883/2883-preview.mp3"
      ),
      otherWrong: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/132/132-preview.mp3"
      ),

      // Timer and notification sounds
      timeout: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/1059/1059-preview.mp3"
      ),
      timerTick: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/1529/1529-preview.mp3"
      ),
      error: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/3137/3137-preview.mp3"
      ),
      teamCorrect: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"
      ),
      teamWrong: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2883/2883-preview.mp3"
      ),
     
      // Game progression sounds
      nextQuestion: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2588/2588-preview.mp3"
      ),
      applause: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2099/2099-preview.mp3"
      ),
    };

    // Set volumes - adjust these to balance the sound effects
    this.sounds.buzzerOpen.volume = 0.4;
    this.sounds.buzz.volume = 0.6;
    this.sounds.teamBuzz.volume = 0.5;
    this.sounds.otherBuzz.volume = 0.3;
    this.sounds.secondChance.volume = 0.5;
    // Add these to the sounds object in AudioManager constructor:

    // And set their volumes after the existing volume settings:
    this.sounds.teamCorrect.volume = 0.4;
    this.sounds.teamWrong.volume = 0.4;
    this.sounds.teamBuzz.volume = 0.4;
    this.sounds.correct.volume = 0.5;
    this.sounds.otherCorrect.volume = 0.3;
    this.sounds.wrong.volume = 0.4;
    this.sounds.otherWrong.volume = 0.3;

    this.sounds.timeout.volume = 0.4;
    this.sounds.timerTick.volume = 0.2;
    this.sounds.error.volume = 0.3;

    this.sounds.nextQuestion.volume = 0.4;
    this.sounds.applause.volume = 0.5;

    // Preload sounds
    Object.values(this.sounds).forEach((sound) => {
      sound.preload = "auto";
      // Create a temporary event to start loading
      sound.addEventListener("canplaythrough", () => {}, { once: true });
      sound.load();
    });

    // Initialize background music
    this.bgMusic = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/1393/1393-preview.mp3"
    );
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.1;
  }

  // Play a ticking sound for the last 5 seconds of a timer
  playTimerTick(secondsLeft: number) {
    if (this.enabled && secondsLeft <= 5 && secondsLeft > 0) {
      const tickSound = this.sounds.timerTick.cloneNode() as HTMLAudioElement;
      tickSound.volume = 0.15;
      tickSound.play().catch(() => {});
    }
  }

  playSound(soundName: string) {
    if (this.enabled && this.sounds[soundName]) {
      // Create a new audio object for each play to allow overlapping sounds
      if (
        ["buzz", "correct", "wrong", "timeout", "secondChance"].includes(
          soundName
        )
      ) {
        // For important sounds, stop any playing instances first
        this.stopSound(soundName);
        this.sounds[soundName].currentTime = 0;
        this.sounds[soundName].play().catch(() => {});
      } else {
        // For other sounds, create a clone to allow overlapping
        const soundClone = this.sounds[
          soundName
        ].cloneNode() as HTMLAudioElement;
        soundClone.volume = this.sounds[soundName].volume;
        soundClone.play().catch(() => {});
      }
    }
  }

  stopSound(soundName: string) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].pause();
      this.sounds[soundName].currentTime = 0;
    }
  }

  toggleSound(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      // Stop all sounds and music
      Object.values(this.sounds).forEach((sound) => {
        sound.pause();
        sound.currentTime = 0;
      });
      if (this.bgMusic) {
        this.bgMusic.pause();
      }
    } else if (this.bgMusic) {
      this.bgMusic.play().catch(() => {});
    }
    return this.enabled;
  }

  startBgMusic() {
    if (this.enabled && this.bgMusic) {
      this.bgMusic.play().catch(() => {});
    }
  }

  stopBgMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  // Play a sequence of sounds with delays
  async playSoundSequence(soundNames: string[], delayMs: number = 500) {
    if (!this.enabled) return;

    for (const soundName of soundNames) {
      this.playSound(soundName);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export default AudioManager;
