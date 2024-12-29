export const APP_CONFIG = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_AUDIO_FORMATS: ['audio/wav', 'audio/mp3', 'audio/mpeg'],
  API_TIMEOUT: 30000, // 30 seconds
  CHAT_POLL_INTERVAL: 3000, // 3 seconds
};

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  CHAT: '/c/:sessionId',
  PATIENTS: '/patients',
  TEMPLATES: '/templates',
} as const;