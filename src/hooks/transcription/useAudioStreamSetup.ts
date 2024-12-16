import { useCallback, useRef } from 'react';
import { getDeviceType } from '@/utils/deviceDetection';

export const useAudioStreamSetup = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const { isIOS } = getDeviceType();

  const setupAudioStream = useCallback(async () => {
    // Configure audio constraints based on device
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: isIOS ? 44100 : 16000, // iOS requires 44.1kHz
    };

    console.log('[useAudioStreamSetup] Requesting media with constraints:', audioConstraints);

    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: audioConstraints
    });
    
    // Verify we have an active audio track
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('No audio track available');
    }

    console.log('[useAudioStreamSetup] Audio track obtained:', {
      label: audioTrack.label,
      enabled: audioTrack.enabled,
      muted: audioTrack.muted,
      readyState: audioTrack.readyState
    });

    streamRef.current = stream;
    return stream;
  }, [isIOS]);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('[useAudioStreamSetup] Stopping track:', {
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState
        });
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  return {
    setupAudioStream,
    cleanupStream,
    streamRef
  };
};