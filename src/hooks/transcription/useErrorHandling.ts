import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TranscriptionError } from './types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export const useErrorHandling = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { toast } = useToast();

  const handleTranscriptionError = async (error: any, retryCallback: () => void): Promise<boolean> => {
    const transcriptionError = error as TranscriptionError;
    
    console.error('Transcription error details:', {
      message: transcriptionError.message,
      status: transcriptionError.status,
      retryable: transcriptionError.retryable,
      details: transcriptionError.details,
      retryCount,
    });
    
    if (transcriptionError.retryable !== false && retryCount < MAX_RETRIES) {
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
    
    if (transcriptionError.status === 500) {
      toast({
        title: "Server Error",
        description: "An unexpected error occurred. Our team has been notified.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error",
        description: transcriptionError.message || "Failed to transcribe audio",
        variant: "destructive",
      });
    }
    
    return false;
  };

  return {
    handleTranscriptionError,
    isReconnecting,
    retryCount,
  };
};