import { useState, useCallback, useRef, memo } from 'react';
import AudioControls from './AudioControls';
import { useRecording } from '@/hooks/transcription/useRecording';
import { useAudioProcessing } from '@/hooks/transcription/useAudioProcessing';
import { useAudioPermissions } from '@/hooks/transcription/useAudioPermissions';
import { useNetworkMonitor } from '@/hooks/transcription/useNetworkMonitor';
import { useTranscriptionValidation } from '@/hooks/transcription/useTranscriptionValidation';
import { useToast } from '@/hooks/use-toast';
import { getDeviceType } from '@/utils/deviceDetection';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const AudioRecorder = memo(({ onTranscriptionComplete, onRecordingStateChange }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const recordingStateRef = useRef(false);
  const { hasPermission, requestPermission, handlePermissionError } = useAudioPermissions();
  const networkType = useNetworkMonitor();
  const validateTranscription = useTranscriptionValidation(onTranscriptionComplete);
  const { toast } = useToast();
  const { isIOS } = getDeviceType();

  const handleError = useCallback((error: string) => {
    console.error('[AudioRecorder] Error:', error);
    setIsRecording(false);
    setIsInitializing(false);
    recordingStateRef.current = false;
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

  const handleTranscriptionSuccess = useCallback((text: string) => {
    console.log('[AudioRecorder] Transcription completed:', text);
    if (validateTranscription(text)) {
      setIsRecording(false);
      recordingStateRef.current = false;
      onRecordingStateChange?.(false);
      toast({
        title: "Success",
        description: "Recording completed successfully",
        duration: 3000,
      });
    }
  }, [validateTranscription, onRecordingStateChange, toast]);

  const { startRecording: startRec, stopRecording: stopRec } = useRecording({
    onError: handleError,
    onTranscriptionComplete: handleTranscriptionSuccess
  });

  const { handleFileUpload } = useAudioProcessing({
    onTranscriptionComplete: handleTranscriptionSuccess,
    onError: handleError
  });

  const handleStartRecording = useCallback(async () => {
    console.log('[AudioRecorder] Starting recording attempt');
    
    if (isInitializing || isRecording) {
      console.log('[AudioRecorder] Already initializing or recording, ignoring start request');
      return;
    }

    setIsInitializing(true);

    try {
      if (!hasPermission) {
        console.log('[AudioRecorder] No permission, requesting...');
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Microphone permission denied');
        }
      }

      console.log('[AudioRecorder] Starting recording with network:', networkType);
      await startRec();
      recordingStateRef.current = true;
      setIsRecording(true);
      onRecordingStateChange?.(true);
    } catch (error) {
      console.error('[AudioRecorder] Start recording error:', error);
      handleError(error instanceof Error ? error.message : 'Failed to start recording');
    } finally {
      setIsInitializing(false);
    }
  }, [networkType, onRecordingStateChange, startRec, hasPermission, requestPermission, handleError, isInitializing, isRecording]);

  const handleStopRecording = useCallback(async () => {
    console.log('[AudioRecorder] Stopping recording...');
    if (!isRecording) {
      console.log('[AudioRecorder] Not recording, ignoring stop request');
      return;
    }

    try {
      await stopRec();
    } catch (error) {
      console.error('[AudioRecorder] Stop recording error:', error);
      handleError(error instanceof Error ? error.message : 'Failed to stop recording');
    }
  }, [stopRec, handleError, isRecording]);

  return (
    <AudioControls
      isRecording={isRecording}
      isInitializing={isInitializing}
      onStartRecording={handleStartRecording}
      onStopRecording={handleStopRecording}
      onFileUpload={handleFileUpload}
      onTranscriptionComplete={onTranscriptionComplete}
    />
  );
});

AudioRecorder.displayName = 'AudioRecorder';

export default AudioRecorder;