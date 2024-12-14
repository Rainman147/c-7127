import { useState } from 'react';
import { useErrorHandling } from './transcription/useErrorHandling';
import { useAudioProcessing } from './transcription/useAudioProcessing';
import { TranscriptionHookProps } from './transcription/types';
import { validateAudioData } from '@/utils/audioUtils';
import { secureLog } from '@/utils/securityUtils';

export const useTranscription = ({ 
  onTranscriptionComplete, 
  onTranscriptionUpdate 
}: TranscriptionHookProps) => {
  const { handleTranscriptionError, isReconnecting } = useErrorHandling();
  const { processAudioData, updateTranscription, liveTranscription } = useAudioProcessing();

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