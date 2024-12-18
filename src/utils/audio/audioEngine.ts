/**
 * Handles core audio functionality using Web Audio API
 */

class AudioEngine {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    console.log('[AudioEngine] Initializing audio engine');
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      console.log('[AudioEngine] Audio context created successfully');
    } catch (error) {
      console.error('[AudioEngine] Failed to initialize audio context:', error);
      throw new Error('Failed to initialize audio system');
    }
  }

  async loadAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    console.log('[AudioEngine] Loading audio data:', { 
      size: arrayBuffer.byteLength,
      type: Object.prototype.toString.call(arrayBuffer)
    });
    
    if (!this.context) {
      throw new Error('Audio context not initialized');
    }

    if (!(arrayBuffer instanceof ArrayBuffer)) {
      console.error('[AudioEngine] Invalid input: not an ArrayBuffer');
      throw new Error('Invalid audio data format');
    }

    try {
      // Resume context if it's suspended (needed for some browsers)
      if (this.context.state === 'suspended') {
        console.log('[AudioEngine] Resuming suspended audio context');
        await this.context.resume();
      }

      // Create a copy of the ArrayBuffer to ensure it's not modified during decoding
      const bufferCopy = arrayBuffer.slice(0);
      console.log('[AudioEngine] Attempting to decode audio data');
      
      const audioBuffer = await this.context.decodeAudioData(bufferCopy);
      console.log('[AudioEngine] Audio data decoded successfully:', {
        duration: audioBuffer.duration,
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      });
      
      return audioBuffer;
    } catch (error) {
      console.error('[AudioEngine] Failed to decode audio data:', error);
      throw new Error('Failed to decode audio data');
    }
  }

  play(buffer: AudioBuffer): void {
    console.log('[AudioEngine] Starting playback');
    if (!this.context) {
      throw new Error('Audio context not initialized');
    }

    // Stop any existing playback
    this.stop();

    try {
      this.source = this.context.createBufferSource();
      this.source.buffer = buffer;
      this.source.connect(this.gainNode!);
      
      this.source.onended = () => {
        console.log('[AudioEngine] Playback ended naturally');
        this.isPlaying = false;
        this.source = null;
      };

      // Resume context if it's suspended (needed for some browsers)
      if (this.context.state === 'suspended') {
        console.log('[AudioEngine] Resuming suspended audio context');
        this.context.resume();
      }

      this.source.start(0);
      this.isPlaying = true;
      console.log('[AudioEngine] Playback started successfully');
    } catch (error) {
      console.error('[AudioEngine] Playback failed:', error);
      throw new Error('Failed to start audio playback');
    }
  }

  stop(): void {
    console.log('[AudioEngine] Stopping playback');
    if (this.source && this.isPlaying) {
      try {
        this.source.stop();
        this.source.disconnect();
        this.source = null;
        this.isPlaying = false;
        console.log('[AudioEngine] Playback stopped successfully');
      } catch (error) {
        console.error('[AudioEngine] Error stopping playback:', error);
      }
    }
  }

  cleanup(): void {
    console.log('[AudioEngine] Cleaning up resources');
    this.stop();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.gainNode = null;
  }
}

// Create and export a singleton instance
export const audioEngine = new AudioEngine();