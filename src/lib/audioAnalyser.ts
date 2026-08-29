class AudioAnalyserManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private isInitialized = false;
  private boundElements: WeakSet<HTMLAudioElement> = new WeakSet();

  initAnalyser(audioElement: HTMLAudioElement): void {
    if (this.boundElements.has(audioElement) && this.isInitialized) {
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.connect(this.audioContext.destination);
    }

    if (!this.boundElements.has(audioElement)) {
      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.boundElements.add(audioElement);
    }

    this.isInitialized = true;
  }

  async resumeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getWaveformData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  destroy(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
    this.boundElements = new WeakSet();
  }
}

export const audioAnalyser = new AudioAnalyserManager();
