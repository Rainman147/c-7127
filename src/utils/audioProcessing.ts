export const createAudioProcessingPipeline = (audioContext: AudioContext) => {
  // Create audio processing nodes
  const noiseFilter = audioContext.createBiquadFilter();
  const highPassFilter = audioContext.createBiquadFilter();
  const lowPassFilter = audioContext.createBiquadFilter();
  const compressor = audioContext.createDynamicsCompressor();

  // Configure high-pass filter to remove low-frequency noise
  highPassFilter.type = 'highpass';
  highPassFilter.frequency.value = 85; // Hz - removes very low rumble
  highPassFilter.Q.value = 0.7; // Quality factor

  // Configure low-pass filter to remove high-frequency noise
  lowPassFilter.type = 'lowpass';
  lowPassFilter.frequency.value = 8000; // Hz - human speech typically below this
  lowPassFilter.Q.value = 0.7;

  // Configure noise gate filter
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 50;
  noiseFilter.Q.value = 1.0;

  // Configure compressor for dynamic range control
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  // Connect nodes in series
  const connectNodes = (source: AudioNode) => {
    source
      .connect(highPassFilter)
      .connect(lowPassFilter)
      .connect(noiseFilter)
      .connect(compressor)
      .connect(audioContext.destination);
  };

  return {
    connectNodes,
    nodes: {
      highPassFilter,
      lowPassFilter,
      noiseFilter,
      compressor
    }
  };
};

export const encodeAudioData = (float32Array: Float32Array): string => {
  // Convert to 16-bit PCM
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Convert to base64
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};