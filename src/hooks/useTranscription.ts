import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deidentifyText, secureLog, validateTLSVersion } from '@/utils/securityUtils';

interface UseTranscriptionProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
}

export const useTranscription = ({ 
  onTranscriptionComplete, 
  onTranscriptionUpdate 
}: UseTranscriptionProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const { toast } = useToast();
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  const handleTranscriptionError = async (error: any, retryCallback: () => void) => {
    secureLog('Transcription error', { error: error.message });
    
    if (retryCount < MAX_RETRIES) {
      setIsReconnecting(true);
      toast({
        title: "Connection lost",
        description: `Attempting to reconnect... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
        variant: "default",
      });
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      setRetryCount(prev => prev + 1);
      retryCallback();
      return true;
    }
    
    setIsReconnecting(false);
    setRetryCount(0);
    toast({
      title: "Error",
      description: "Failed to transcribe audio after multiple attempts. Please try again.",
      variant: "destructive",
    });
    return false;
  };

  const handleAudioData = async (data: string) => {
    if (!validateTLSVersion()) {
      toast({
        title: "Security Error",
        description: "Secure connection required for HIPAA compliance.",
        variant: "destructive",
      });
      return;
    }

    try {
      secureLog('Sending audio chunk', { chunkSize: data.length });
      
      const response = await fetch('https://hlnzunnahksudbotqvpk.supabase.co/functions/v1/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          audioData: data,
          mimeType: 'audio/x-raw',
          streaming: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const responseClone = response.clone();
      let result;
      
      try {
        result = await response.json();
      } catch (error) {
        secureLog('Initial JSON parse failed, trying clone', {});
        result = await responseClone.json();
      }

      secureLog('Transcription received', { hasTranscription: !!result.transcription });
      
      if (result.transcription) {
        const newTranscription = deidentifyText(result.transcription.trim());
        setLiveTranscription(prev => {
          const updated = prev + (prev ? ' ' : '') + newTranscription;
          onTranscriptionUpdate?.(updated);
          return updated;
        });
      }

      if (retryCount > 0) {
        setRetryCount(0);
        setIsReconnecting(false);
        toast({
          title: "Connection restored",
          description: "Transcription has resumed successfully.",
          variant: "default",
        });
      }
    } catch (error) {
      await handleTranscriptionError(error, () => handleAudioData(data));
    }
  };

  return {
    handleAudioData,
    isReconnecting,
    liveTranscription,
    retryCount
  };
};