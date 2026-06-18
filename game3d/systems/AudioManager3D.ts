const SFX_PATHS = {
  jump: '/audio/jump.wav',
  star: '/audio/star.wav',
  damage: '/audio/damage.wav',
  gate: '/audio/magic-gate.mp3',
  fail: '/audio/fail.wav',
  sandstorm: '/audio/sandstorm.wav',
  stageSuccess: '/audio/stageSuccess.wav',
} as const;

type SfxKey = keyof typeof SFX_PATHS;

export class AudioManager3D {
  private soundEnabled = true;
  private cache = new Map<SfxKey, HTMLAudioElement>();
  private looping = new Map<SfxKey, HTMLAudioElement>();

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('soundEnabled', enabled ? '1' : '0');
    }
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  play(key: SfxKey) {
    if (!this.soundEnabled) return;
    try {
      let audio = this.cache.get(key);
      if (!audio) {
        audio = new Audio(SFX_PATHS[key]);
        audio.preload = 'auto';
        audio.volume = key === 'gate' ? 0.5 : key === 'sandstorm' ? 0.45 : 0.6;
        this.cache.set(key, audio);
      }
      audio.currentTime = 0;
      void audio.play();
    } catch {
      // ignore autoplay / missing device
    }
  }

  playLoop(key: SfxKey) {
    if (!this.soundEnabled) return;
    try {
      let audio = this.looping.get(key);
      if (!audio) {
        audio = new Audio(SFX_PATHS[key]);
        audio.preload = 'auto';
        audio.loop = true;
        audio.volume = key === 'sandstorm' ? 0.35 : 0.5;
        this.looping.set(key, audio);
      }
      if (audio.paused) void audio.play();
    } catch {
      /* ignore */
    }
  }

  stopLoop(key: SfxKey) {
    const audio = this.looping.get(key);
    if (audio) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }
}
