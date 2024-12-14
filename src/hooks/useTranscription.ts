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

  const handleAudioData = async (data: string) => {
    try {
      validateAudioData(data);
      secureLog('Sending audio chunk', { chunkSize: data.length });
      
      const transcription = await processAudioData(data);
      updateTranscription(transcription);
      onTranscriptionUpdate?.(transcription);
      
    } catch (error) {
      await handleTranscriptionError(error, () => handleAudioData(data));
    }
  };

  return {
    handleAudioData,
    isReconnecting,
    liveTranscription
  };
};