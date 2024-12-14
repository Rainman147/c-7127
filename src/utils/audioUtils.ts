export const CHUNK_SIZE = 120; // 2 minutes in seconds
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const SUPPORTED_FORMATS = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm'
];

export const validateAudioFile = (file: File) => {
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    throw new Error(`Unsupported format. Please upload a WAV, MP3, M4A, or WebM file.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }
};

export const splitAudioIntoChunks = async (audioBlob: Blob): Promise<Blob[]> => {
  // For now, we'll just return the whole blob as one chunk
  // In a future update, we can implement actual audio chunking using Web Audio API
  return [audioBlob];
};

export const mergeTranscriptions = (transcriptions: string[]): string => {
  return transcriptions.join(' ');
};

// Audio preprocessing utilities
export const normalizeAudio = async (audioData: Float32Array): Promise<Float32Array> => {
  const maxAmplitude = Math.max(...audioData.map(Math.abs));
  if (maxAmplitude === 0) return audioData;
  
  const normalizedData = new Float32Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    normalizedData[i] = audioData[i] / maxAmplitude;
  }
  
  return normalizedData;
};

export const applyNoiseGate = (audioData: Float32Array, threshold = 0.01): Float32Array => {
  return audioData.map(sample => Math.abs(sample) < threshold ? 0 : sample);
};