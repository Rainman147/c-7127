import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMediaStream, cleanupMediaStream } from '@/utils/mediaStreamUtils';

interface AudioStreamManagerProps {
  onStreamStart: (stream: MediaStream) => void;
  onStreamError: (error: Error) => void;
  onStreamStop: () => void;
}

export const useAudioStreamManager = ({
  onStreamStart,
  onStreamError,
  onStreamStop
}: AudioStreamManagerProps) => {
  const { toast } = useToast();

  const startStream = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await getMediaStream();
      console.log('Microphone access granted');
      onStreamStart(stream);
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
      onStreamError(error);
    }
  }, [onStreamStart, onStreamError, toast]);

  const stopStream = useCallback(() => {
    cleanupMediaStream();
    onStreamStop();
  }, [onStreamStop]);

  return {
    startStream,
    stopStream
  };
};