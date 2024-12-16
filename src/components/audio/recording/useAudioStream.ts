import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getDeviceAudioConfig } from './AudioConfigProvider';

export const useAudioStream = () => {
  const { toast } = useToast();

  const getStream = useCallback(async () => {
    try {
      console.log('Requesting audio stream with device-specific configuration');
      const audioConfig = await getDeviceAudioConfig();
      console.log('Using audio configuration:', audioConfig);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: audioConfig.sampleRate },
          channelCount: { ideal: audioConfig.channelCount },
          echoCancellation: audioConfig.echoCancellation,
          noiseSuppression: audioConfig.noiseSuppression,
          autoGainControl: audioConfig.autoGainControl
        }
      });

      console.log('Audio stream obtained successfully');
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const cleanupStream = useCallback((stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log(`Stopped audio track: ${track.kind}`);
    });
  }, []);

  return {
    getStream,
    cleanupStream
  };
};