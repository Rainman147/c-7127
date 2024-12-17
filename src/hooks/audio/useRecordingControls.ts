import { useCallback } from 'react';
import { useSimplifiedRecording } from '../transcription/useSimplifiedRecording';
import { useAudioPermissionsWithDelay } from './useAudioPermissionsWithDelay';
import { useRecordingToasts } from './useRecordingToasts';
import { getDeviceType } from '@/utils/deviceDetection';

interface RecordingControlsProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export const useRecordingControls = ({
  onTransordingStateChange,
  onTranscriptionComplete
}: RecordingControlsProps) => {
  const { isIOS } = getDeviceType();
  const { ensurePermission, handlePermissionError } = useAudioPermissionsWithDelay();
  const { showStartRecordingToast, showStopRecordingToast, showErrorToast } = useRecordingToasts();

  const handleError = useCallback((error: string) => {
    console.error('[RecordingControls] Error:', error);
    onRecordingStateChange?.(false);

    if (error.includes('Permission denied')) {
      handlePermissionError();
    } else {
      showErrorToast(error);
    }
  }, [handlePermissionError, onRecordingStateChange, showErrorToast]);

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

  const startRecording = useCallback(async () => {
    console.log('[RecordingControls] Starting recording attempt');
    console.log('[RecordingControls] Device type:', { isIOS });
    
    if (isProcessing || isRecording) {
      console.log('[RecordingControls] Already processing or recording, ignoring start request');
      return;
    }

    try {
      await ensurePermission();
      await startRec();
      onRecordingStateChange?.(true);
      showStartRecordingToast();
    } catch (error) {
      console.error('[RecordingControls] Start recording error:', error);
      handleError(error instanceof Error ? error.message : 'Failed to start recording');
    }
  }, [isProcessing, isRecording, ensurePermission, startRec, onRecordingStateChange, showStartRecordingToast, handleError, isIOS]);

  const stopRecording = useCallback(async () => {
    console.log('[RecordingControls] Stopping recording...');
    if (!isRecording) {
      console.log('[RecordingControls] Not recording, ignoring stop request');
      return;
    }

    try {
      await stopRec();
      onRecordingStateChange?.(false);
      showStopRecordingToast();
    } catch (error) {
      console.error('[RecordingControls] Stop recording error:', error);
      handleError(error instanceof Error ? error.message : 'Failed to stop recording');
    }
  }, [stopRec, handleError, isRecording, onRecordingStateChange, showStopRecordingToast]);

  return {
    isRecording,
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    startRecording,
    stopRecording
  };
};