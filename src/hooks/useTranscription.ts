import { useState } from 'react';
import { useErrorHandling } from './transcription/useErrorHandling';
import { useAudioProcessing } from './transcription/useAudioProcessing';
import { TranscriptionHookProps } from './transcription/types';
import { validateAudioData } from '@/utils/audioUtils';
import { secureLog } from '@/utils/securityUtils';
import { useToast } from './use-toast';

export const useTranscription = ({ 
  onTranscriptionComplete, 
  onTranscriptionUpdate 
}: TranscriptionHookProps) => {
  const { handleTranscriptionError, isReconnecting } = useErrorHandling();
  const { toast } = useToast();
  
  const { processAudioData, updateTranscription, liveTranscription } = useAudioProcessing({
    onTranscriptionComplete,
    onError: (error: string) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  });

  const handleAudioData = async (data: string, mimeType: string = 'audio/webm') => {
    try {
      validateAudioData(data);
      secureLog('Sending audio chunk', { chunkSize: data.length });
      
      const transcription = await processAudioData(data, mimeType);
      console.log('Received transcription:', transcription);
      
      if (transcription && transcription.trim()) {
        // Send the update to the input field
        onTranscriptionUpdate?.(transcription);
        
        // Update internal state
        updateTranscription(transcription);
      }
      
    } catch (error) {
      await handleTranscriptionError(error, () => handleAudioData(data, mimeType));
    }
  };

  return {
    handleAudioData,
    isReconnecting,
    liveTranscription
  };
};