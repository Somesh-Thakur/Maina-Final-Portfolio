/**
 * Web Audio DSP Processing Suite for Maina
 * Features:
 * - Smart GainNode Crossfading
 * - Loudness Normalization / DynamicsCompressorNode
 * - Karaoke Vocal Reducer (Center-channel phase cancellation)
 */

class AudioFXManager {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private karaokeGain: GainNode | null = null;
  private normalGain: GainNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private inverter: GainNode | null = null;

  private isKaraoke = false;
  private isNormalized = true;
  private crossfadeDuration = 3; // default 3s
  private initializedElement: HTMLAudioElement | null = null;

  init(audioElement: HTMLAudioElement): void {
    if (typeof window === 'undefined') return;
    if (this.initializedElement === audioElement && this.ctx) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.ctx) {
        this.ctx = new AudioContextClass();
      }

      this.initializedElement = audioElement;

      if (!this.sourceNode) {
        this.sourceNode = this.ctx.createMediaElementSource(audioElement);
      }

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;

      // Dynamics Compressor (Loudness Normalization)
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Normal path gain
      this.normalGain = this.ctx.createGain();
      this.normalGain.gain.value = this.isKaraoke ? 0 : 1;

      // Karaoke path (Mid/Side Center Cancellation)
      this.karaokeGain = this.ctx.createGain();
      this.karaokeGain.gain.value = this.isKaraoke ? 1 : 0;

      this.splitter = this.ctx.createChannelSplitter(2);
      this.merger = this.ctx.createChannelMerger(2);
      this.inverter = this.ctx.createGain();
      this.inverter.gain.value = -1.0; // Invert phase of right channel

      // Graph: Source -> Normal Gain -> Compressor -> Master Gain -> Destination
      this.sourceNode.connect(this.normalGain);
      this.normalGain.connect(this.compressor);

      // Karaoke Graph: Source -> Splitter -> (Left + Inverted Right) -> Merger -> Karaoke Gain -> Compressor
      this.sourceNode.connect(this.splitter);
      this.splitter.connect(this.merger, 0, 0); // Left to Left
      this.splitter.connect(this.inverter, 1);   // Right to Inverter
      this.inverter.connect(this.merger, 0, 1); // Inverted Right to Right
      this.merger.connect(this.karaokeGain);
      this.karaokeGain.connect(this.compressor);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch (err) {
      console.warn('[AudioFX] Web Audio graph initialization note:', err);
    }
  }

  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {}
    }
  }

  setKaraoke(enabled: boolean): void {
    this.isKaraoke = enabled;
    if (!this.ctx || !this.normalGain || !this.karaokeGain) return;

    const now = this.ctx.currentTime;
    if (enabled) {
      this.normalGain.gain.setTargetAtTime(0, now, 0.08);
      this.karaokeGain.gain.setTargetAtTime(1.4, now, 0.08);
    } else {
      this.karaokeGain.gain.setTargetAtTime(0, now, 0.08);
      this.normalGain.gain.setTargetAtTime(1, now, 0.08);
    }
  }

  getIsKaraoke(): boolean {
    return this.isKaraoke;
  }

  setNormalization(enabled: boolean): void {
    this.isNormalized = enabled;
    if (!this.ctx || !this.compressor) return;

    const now = this.ctx.currentTime;
    if (enabled) {
      this.compressor.threshold.setTargetAtTime(-24, now, 0.1);
      this.compressor.ratio.setTargetAtTime(6, now, 0.1);
    } else {
      this.compressor.threshold.setTargetAtTime(0, now, 0.1);
      this.compressor.ratio.setTargetAtTime(1, now, 0.1);
    }
  }

  getIsNormalized(): boolean {
    return this.isNormalized;
  }

  setCrossfadeDuration(seconds: number): void {
    this.crossfadeDuration = Math.max(0, Math.min(12, seconds));
  }

  getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  fadeIn(duration = 1.5): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(1.0, now + duration);
  }

  fadeOut(duration = 1.5): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ctx || !this.masterGain) {
        resolve();
        return;
      }
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.01, now + duration);
      setTimeout(() => {
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        }
        resolve();
      }, duration * 1000);
    });
  }

  fadeVolumeForSleep(seconds = 45): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ctx || !this.masterGain) {
        resolve();
        return;
      }
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
      setTimeout(resolve, seconds * 1000);
    });
  }
}

export const audioFX = new AudioFXManager();
