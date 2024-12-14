export const CHUNK_SIZE = 120; // 2 minutes in seconds
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const SUPPORTED_FORMATS = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];

export const validateAudioFile = (file: File) => {
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    throw new Error(`Unsupported format. Please upload a WAV, MP3, or M4A file.`);
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