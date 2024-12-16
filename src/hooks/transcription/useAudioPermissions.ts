import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getDeviceType } from '@/utils/deviceDetection';

export const useAudioPermissions = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { isIOS } = getDeviceType();

  const checkPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('[useAudioPermissions] Permission state:', result.state);
      setHasPermission(result.state === 'granted');
      
      result.onchange = () => {
        console.log('[useAudioPermissions] Permission changed:', result.state);
        setHasPermission(result.state === 'granted');
      };
    } catch (error) {
      console.log('[useAudioPermissions] Error checking permission:', error);
      // On iOS, we can't check permissions directly
      if (isIOS) {
        setHasPermission(null);
      }
    }
  }, [isIOS]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const requestPermission = useCallback(async () => {
    console.log('[useAudioPermissions] Requesting microphone permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('[useAudioPermissions] Permission granted');
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('[useAudioPermissions] Permission denied:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const handlePermissionError = useCallback(() => {
    if (isIOS) {
      toast({
        title: "Microphone Access Required",
        description: "Please enable microphone access in your iOS Settings > Safari > Microphone",
        variant: "destructive",
        duration: 5000
      });
    } else {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record audio",
        variant: "destructive"
      });
    }
  }, [isIOS, toast]);

  return {
    hasPermission,
    requestPermission,
    handlePermissionError
  };
};