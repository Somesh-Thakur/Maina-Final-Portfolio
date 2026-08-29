import { audioFX } from './audioFX';

class AudioAnalyserManager {
  initAnalyser(audioElement: HTMLAudioElement): void {
    audioFX.init(audioElement);
  }

  async resumeContext(): Promise<void> {
    await audioFX.resume();
  }

  getFrequencyData(): Uint8Array {
    return audioFX.getFrequencyData();
  }

  getWaveformData(): Uint8Array {
    return audioFX.getWaveformData();
  }

  destroy(): void {
    // Handled by audioFX singleton
  }
}

export const audioAnalyser = new AudioAnalyserManager();
