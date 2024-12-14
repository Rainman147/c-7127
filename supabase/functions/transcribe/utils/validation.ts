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

export const validateAudioPayload = (payload: any): AudioPayload => {
  if (!payload) {
    throw new Error('Missing payload');
  }

  if (!payload.audioData) {
    throw new Error('Missing audio data');
  }

  if (!payload.metadata?.mimeType) {
    throw new Error('Missing MIME type in metadata');
  }

  return payload as AudioPayload;
};