import { useCallback } from 'react';
import { getDeviceType, getBrowserType } from '@/utils/deviceDetection';

export const useAudioStream = () => {
  const { isIOS } = getDeviceType();
  const { isChrome } = getBrowserType();

  const getAudioConfig = () => ({
    sampleRate: isIOS ? 44100 : 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(isChrome && {
      latencyHint: 'interactive',
      googEchoCancellation: true,
      googAutoGainControl: true,
      googNoiseSuppression: true,
      googHighpassFilter: true
    })
  });

  const getStream = useCallback(async () => {
    try {
      const audioConfig = getAudioConfig();
      console.log('Requesting microphone access with config:', audioConfig);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConfig
      });
      
      console.log('Microphone access granted');
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Could not access microphone. Please check permissions.');
    }
  }, [isIOS, isChrome]);

  const cleanupStream = useCallback((stream: MediaStream) => {
    stream.getTracks().forEach(track => track.stop());
    console.log('Media stream cleaned up');
  }, []);

  return {
    getStream,
    cleanupStream
  };
};