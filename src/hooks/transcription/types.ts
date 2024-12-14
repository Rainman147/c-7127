export interface TranscriptionError extends Error {
  status?: number;
  retryable?: boolean;
  details?: any;
}

export interface TranscriptionHookProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
}

export interface AudioMetadata {
  duration?: number;
  sampleRate?: number;
  channels?: number;
  mimeType: string;
  streaming: boolean;
}

export interface AudioPayload {
  audioData: string;
  metadata: AudioMetadata;
}