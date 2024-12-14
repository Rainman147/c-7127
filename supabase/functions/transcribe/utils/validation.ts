export interface AudioPayload {
  audioData: string;
  metadata: {
    mimeType: string;
    duration?: number;
    sampleRate?: number;
    channels?: number;
    streaming: boolean;
  }
}

export interface ValidationError extends Error {
  status: number;
  retryable: boolean;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  'audio/wav',
  'audio/x-wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/x-raw',
  'audio/webm'
];

export const validateAudioPayload = (payload: any): AudioPayload => {
  console.log('Validating audio payload structure...');
  
  if (!payload) {
    throw createValidationError('Missing payload', 400, false);
  }

  if (!payload.audioData) {
    throw createValidationError('Missing audio data', 400, false);
  }

  if (!payload.metadata?.mimeType) {
    throw createValidationError('Missing MIME type in metadata', 400, false);
  }

  validateAudioFormat(payload.metadata.mimeType);
  validateAudioSize(payload.audioData);

  console.log('Audio payload validation successful');
  return payload as AudioPayload;
};

const validateAudioFormat = (mimeType: string) => {
  console.log(`Validating audio format: ${mimeType}`);
  
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw createValidationError(
      `Invalid audio format. Supported formats: ${ALLOWED_MIME_TYPES.join(', ')}`,
      400,
      false
    );
  }
};

const validateAudioSize = (audioData: string) => {
  const sizeInBytes = Buffer.from(audioData, 'base64').length;
  console.log(`Validating audio size: ${sizeInBytes} bytes`);
  
  if (sizeInBytes > MAX_FILE_SIZE) {
    throw createValidationError(
      `Audio file too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      400,
      false
    );
  }
};

const createValidationError = (message: string, status: number, retryable: boolean): ValidationError => {
  const error = new Error(message) as ValidationError;
  error.status = status;
  error.retryable = retryable;
  return error;
};