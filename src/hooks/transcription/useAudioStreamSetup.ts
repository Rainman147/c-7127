import { useCallback, useRef } from 'react';
import { getDeviceType } from '@/utils/deviceDetection';

export const useAudioStreamSetup = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const { isIOS } = getDeviceType();

  const checkAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      console.log('[useAudioStreamSetup] Available audio devices:', audioDevices);
      
      if (audioDevices.length === 0) {
        throw new Error('No microphone detected. Please connect a microphone and try again.');
      }
      
      return true;
    } catch (error) {
      console.error('[useAudioStreamSetup] Error checking audio devices:', error);
      throw new Error('Unable to access audio devices. Please check microphone permissions and connections.');
    }
  };

  const setupAudioStream = useCallback(async () => {
    // First check if we have any audio devices
    await checkAudioDevices();

    // Configure audio constraints based on device
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: isIOS ? 44100 : 16000, // iOS requires 44.1kHz
    };

    console.log('[useAudioStreamSetup] Requesting media with constraints:', audioConstraints);

    try {
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
    } catch (error: any) {
      console.error('[useAudioStreamSetup] Error accessing microphone:', error);
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Microphone access denied. Please allow microphone access and try again.');
      } else {
        throw new Error(`Failed to access microphone: ${error.message}`);
      }
    }
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