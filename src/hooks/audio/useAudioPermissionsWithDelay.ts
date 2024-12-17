import { useCallback } from 'react';
import { useAudioPermissions } from '../transcription/useAudioPermissions';
import { getDeviceType } from '@/utils/deviceDetection';

export const useAudioPermissionsWithDelay = () => {
  const { hasPermission, requestPermission, handlePermissionError } = useAudioPermissions();
  const { isIOS } = getDeviceType();

  const ensurePermission = useCallback(async () => {
    if (!hasPermission) {
      console.log('[AudioPermissions] No permission, requesting...');
      const granted = await requestPermission();
      if (!granted) {
        throw new Error('Microphone permission denied');
      }
      
      // On iOS, we need to wait a moment after permission is granted
      if (isIOS) {
        console.log('[AudioPermissions] iOS detected, adding delay after permission grant');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    return true;
  }, [hasPermission, requestPermission, isIOS]);

  return {
    hasPermission,
    ensurePermission,
    handlePermissionError
  };
};