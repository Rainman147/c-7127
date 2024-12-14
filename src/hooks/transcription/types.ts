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
  mimeType: string;
  streaming: boolean;
  duration?: number;
  sampleRate?: number;
  channels?: number;
}

export interface AudioPayload {
  audioData: string;
  metadata: AudioMetadata;
}