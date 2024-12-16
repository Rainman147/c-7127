/**
 * Normalizes audio data to have a maximum amplitude of 1
 */
export const normalizeAudio = async (audioData: Float32Array): Promise<Float32Array> => {
  const maxAmplitude = Math.max(...audioData.map(Math.abs));
  if (maxAmplitude === 0) return audioData;
  
  const normalizedData = new Float32Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    normalizedData[i] = audioData[i] / maxAmplitude;
  }
  
  return normalizedData;
};

/**
 * Applies a noise gate to remove low-amplitude noise
 */
export const applyNoiseGate = (audioData: Float32Array, threshold = 0.01): Float32Array => {
  return audioData.map(sample => Math.abs(sample) < threshold ? 0 : sample);
};