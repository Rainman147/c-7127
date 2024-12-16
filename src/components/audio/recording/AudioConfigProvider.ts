import { getDeviceType, getBrowserType, getOptimalAudioConfig } from '@/utils/deviceDetection';

export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean | { ideal: boolean };
  noiseSuppression: boolean | { ideal: boolean };
  autoGainControl: boolean | { ideal: boolean };
}

export const getDeviceAudioConfig = (): AudioConfig => {
  const deviceType = getDeviceType();
  const browserType = getBrowserType();
  console.log('Device type:', deviceType);
  console.log('Browser type:', browserType);
  
  return getOptimalAudioConfig();
};

export const getMimeType = (): string => {
  const { isIOS } = getDeviceType();
  const mimeTypes = [
    'audio/webm',
    'audio/mp4',
    'audio/wav',
    'audio/ogg'
  ];

  if (isIOS) {
    mimeTypes.unshift('audio/mp4');
  }

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      console.log(`Using supported MIME type: ${mimeType}`);
      return mimeType;
    }
  }

  console.log('Falling back to default MIME type: audio/webm');
  return 'audio/webm';
};