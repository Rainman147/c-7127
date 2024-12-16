import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getDeviceType } from '@/utils/deviceDetection';

export const useAudioPermissions = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { isIOS } = getDeviceType();

  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setHasPermission(result.state === 'granted');
        
        result.onchange = () => {
          setHasPermission(result.state === 'granted');
        };
      } catch (error) {
        console.error('Error checking microphone permission:', error);
        if (isIOS) {
          setHasPermission(null);
        }
      }
    };

    checkMicrophonePermission();
  }, [isIOS]);

  const handlePermissionError = () => {
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
  };

  return {
    hasPermission,
    handlePermissionError
  };
};