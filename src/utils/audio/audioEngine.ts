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

  private validateAudioData(arrayBuffer: ArrayBuffer): void {
    // Check if the buffer is empty
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Empty audio data received');
    }

    // Log the binary data details
    console.log('[AudioEngine] Validating audio data:', {
      size: arrayBuffer.byteLength,
      type: Object.prototype.toString.call(arrayBuffer)
    });

    // Check for minimum valid MP3 size (MP3 header is typically 10 bytes)
    if (arrayBuffer.byteLength < 10) {
      throw new Error('Invalid audio data: too small to be valid MP3');
    }

    // Basic MP3 header validation (checking for MP3 sync word: 0xFFFB)
    const dataView = new DataView(arrayBuffer);
    const header = dataView.getUint16(0);
    if ((header & 0xFFFE) !== 0xFFFE) {
      console.warn('[AudioEngine] Warning: Data may not be valid MP3 format');
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

    try {
      // Validate the incoming audio data
      this.validateAudioData(arrayBuffer);

      // Create a fallback mechanism using HTML5 Audio API if decoding fails
      const tryFallbackPlayback = async (): Promise<AudioBuffer> => {
        console.log('[AudioEngine] Attempting fallback playback method');
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        return new Promise((resolve, reject) => {
          audio.oncanplaythrough = async () => {
            try {
              // Create an offline context with default values
              const offlineCtx = new OfflineAudioContext(
                2, // Default to stereo
                this.context!.sampleRate * audio.duration,
                this.context!.sampleRate
              );
              
              // Create a temporary online context for media element source
              const tempContext = new AudioContext();
              const source = tempContext.createMediaElementSource(audio);
              const tempGain = tempContext.createGain();
              source.connect(tempGain);
              tempGain.connect(tempContext.destination);
              
              // Render the audio
              const renderedBuffer = await offlineCtx.startRendering();
              URL.revokeObjectURL(url);
              await tempContext.close();
              resolve(renderedBuffer);
            } catch (error) {
              reject(error);
            }
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Fallback playback failed'));
          };
        });
      };

      try {
        // Resume context if it's suspended (needed for some browsers)
        if (this.context.state === 'suspended') {
          console.log('[AudioEngine] Resuming suspended audio context');
          await this.context.resume();
        }

        // Try primary decoding method
        console.log('[AudioEngine] Attempting to decode audio data');
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer.slice(0));
        console.log('[AudioEngine] Audio data decoded successfully:', {
          duration: audioBuffer.duration,
          numberOfChannels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate
        });
        return audioBuffer;
      } catch (error) {
        console.warn('[AudioEngine] Primary decoding failed, attempting fallback:', error);
        return await tryFallbackPlayback();
      }
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