import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecordingState } from './useAudioRecordingState';
import { useRecordingSession } from './useRecordingSession';

interface RecordingHandlerProps {
  isRecording: boolean;
  internalIsRecording: boolean;
  isProcessing: boolean;
  internalIsProcessing: boolean;
  onStartRecording?: () => Promise<void>;
  onStopRecording?: () => Promise<void>;
}

export const useRecordingHandler = ({
  isRecording,
  internalIsRecording,
  isProcessing,
  internalIsProcessing,
  onStartRecording,
  onStopRecording
}: RecordingHandlerProps) => {
  const { toast } = useToast();
  const { updateState, resetState } = useAudioRecordingState();
  const { createSession, clearSession, getSessionId } = useRecordingSession();

  const handleRecordingClick = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const actualIsRecording = isRecording || internalIsRecording;
    const actualIsProcessing = isProcessing || internalIsProcessing;
    
    if (actualIsProcessing) {
      console.log('Ignoring click while processing');
      return;
    }

    try {
      if (actualIsRecording) {
        console.log('Stopping recording...');
        onStopRecording?.();
        updateState({ isRecording: false, isProcessing: true });
        
        const sessionId = getSessionId();
        if (!sessionId) {
          throw new Error('No active recording session');
        }
        
        toast({
          title: "Recording Complete",
          description: "Processing your audio...",
          duration: 3000,
        });
      } else {
        console.log('Starting recording...');
        const sessionId = createSession();
        updateState({ isRecording: true });
        onStartRecording?.();
        
        toast({
          title: "Recording Started",
          description: "Recording session is now active",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error handling recording:', error);
      toast({
        title: "Recording Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      resetState();
      clearSession();
    }
  }, [
    isRecording, 
    internalIsRecording, 
    isProcessing, 
    internalIsProcessing, 
    updateState, 
    resetState, 
    createSession, 
    clearSession, 
    getSessionId, 
    onStartRecording, 
    onStopRecording, 
    toast
  ]);

  return { handleRecordingClick };
};