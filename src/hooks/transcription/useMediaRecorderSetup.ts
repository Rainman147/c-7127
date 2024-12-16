import { useCallback, useRef } from 'react';

interface MediaRecorderSetupProps {
  onDataAvailable: (event: BlobEvent) => void;
  onError: (error: string) => void;
}

export const useMediaRecorderSetup = ({ onDataAvailable, onError }: MediaRecorderSetupProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const setupMediaRecorder = useCallback((stream: MediaStream) => {
    // Set up MediaRecorder with appropriate MIME type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus' 
      : 'audio/webm';
    
    console.log('[useMediaRecorderSetup] Using MIME type:', mimeType);

    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000
    });

    // Set up event handlers
    recorder.ondataavailable = onDataAvailable;
    
    recorder.onerror = (event: ErrorEvent) => {
      console.error('[useMediaRecorderSetup] MediaRecorder error:', event.error);
      onError('Recording failed: ' + (event.error?.message || 'Unknown error'));
    };

    recorder.onstart = () => {
      console.log('[useMediaRecorderSetup] MediaRecorder started successfully');
    };

    recorder.onstop = () => {
      console.log('[useMediaRecorderSetup] MediaRecorder stopped');
    };

    mediaRecorderRef.current = recorder;
    return recorder;
  }, [onDataAvailable, onError]);

  return {
    setupMediaRecorder,
    mediaRecorderRef
  };
};