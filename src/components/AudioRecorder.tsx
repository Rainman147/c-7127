import { useCallback, memo } from 'react';
import AudioControls from './AudioControls';
import { useSimplifiedRecording } from '@/hooks/transcription/useSimplifiedRecording';
import { useAudioPermissions } from '@/hooks/transcription/useAudioPermissions';
import { useToast } from '@/hooks/use-toast';
import { getDeviceType } from '@/utils/deviceDetection';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const AudioRecorder = memo(({ onTranscriptionComplete, onRecordingStateChange }: AudioRecorderProps) => {
  const { toast } = useToast();
  const { hasPermission, requestPermission, handlePermissionError } = useAudioPermissions();
  const { isIOS } = getDeviceType();

  const handleError = useCallback((error: string) => {
    console.error('[AudioRecorder] Error:', error);
    onRecordingStateChange?.(false);

    if (error.includes('Permission denied')) {
      handlePermissionError();
    } else {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [handlePermissionError, onRecordingStateChange, toast]);

  const { 
    isRecording, 
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    startRecording: startRec, 
    stopRecording: stopRec 
  } = useSimplifiedRecording({
    onTranscriptionComplete,
    onError: handleError
  });

  const handleStartRecording = useCallback(async () => {
    console.log('[AudioRecorder] Starting recording attempt');
    console.log('[AudioRecorder] Device type:', { isIOS });
    
    if (isProcessing || isRecording) {
      console.log('[AudioRecorder] Already processing or recording, ignoring start request');
      return;
    }

    try {
      if (!hasPermission) {
        console.log('[AudioRecorder] No permission, requesting...');
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Microphone permission denied');
        }
        
        // On iOS, we need to wait a moment after permission is granted
        if (isIOS) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await startRec();
      onRecordingStateChange?.(true);
      
      toast({
        title: "Recording Started",
        description: "Recording session is now active",
        duration: 3000,
      });
    } catch (error) {
      console.error('[AudioRecorder] Start recording error:', error);
      handleError(error instanceof Error ? error.message : 'Failed to start recording');
    }
  }, [isProcessing, isRecording, hasPermission, requestPermission, startRec, onRecordingStateChange, handleError, toast, isIOS]);

  const handleStopRecording = useCallback(async () => {
    console.log('[AudioRecorder] Stopping recording...');
    if (!isRecording) {
      console.log('[AudioRecorder] Not recording, ignoring stop request');
      return;
    }

    try {
      await stopRec();
      onRecordingStateChange?.(false);
      
      toast({
        title: "Recording Stopped",
        description: "Processing your audio...",
        duration: 3000,
      });
    } catch (error) {
      console.error('[AudioRecorder] Stop recording error:', error);
      handleError(error instanceof Error ? error.message : 'Failed to stop recording');
    }
  }, [stopRec, handleError, isRecording, onRecordingStateChange, toast]);

  return (
    <AudioControls
      isRecording={isRecording}
      isInitializing={false}
      isProcessing={isProcessing}
      progress={progress}
      currentChunk={currentChunk}
      totalChunks={totalChunks}
      onStartRecording={handleStartRecording}
      onStopRecording={handleStopRecording}
      onFileUpload={() => {}}
      onTranscriptionComplete={onTranscriptionComplete}
    />
  );
});

AudioRecorder.displayName = 'AudioRecorder';

export default AudioRecorder;