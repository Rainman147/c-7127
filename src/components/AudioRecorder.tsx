import { useState, useCallback, useRef, useEffect } from 'react';
import AudioControls from './AudioControls';
import { useRecording } from '@/hooks/transcription/useRecording';
import { useAudioProcessing } from '@/hooks/transcription/useAudioProcessing';
import { useAudioPermissions } from '@/hooks/transcription/useAudioPermissions';
import { useNetworkMonitor } from '@/hooks/transcription/useNetworkMonitor';
import { useTranscriptionValidation } from '@/hooks/transcription/useTranscriptionValidation';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const AudioRecorder = ({ onTranscriptionComplete, onRecordingStateChange }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const recordingStateRef = useRef(false);
  const { hasPermission, handlePermissionError } = useAudioPermissions();
  const networkType = useNetworkMonitor();
  const validateTranscription = useTranscriptionValidation(onTranscriptionComplete);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[AudioRecorder] Component mounted');
    return () => {
      console.log('[AudioRecorder] Component unmounting');
      if (recordingStateRef.current) {
        console.log('[AudioRecorder] Cleaning up active recording');
      }
    };
  }, []);

  useEffect(() => {
    // Sync the ref with the state for cleanup purposes
    recordingStateRef.current = isRecording;
  }, [isRecording]);

  const handleError = useCallback((error: string) => {
    console.error('[AudioRecorder] Error:', error);
    setIsRecording(false);
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
    if (!hasPermission) {
      console.log('[AudioRecorder] No permission, requesting...');
      handlePermissionError();
      return;
    }

    if (isRecording) {
      console.log('[AudioRecorder] Already recording, ignoring start request');
      return;
    }

    console.log('[AudioRecorder] Starting recording with network:', networkType);
    try {
      setIsRecording(true);
      onRecordingStateChange?.(true);
      await startRec();
    } catch (error) {
      console.error('[AudioRecorder] Start recording error:', error);
      handleError(error as string);
    }
  }, [networkType, onRecordingStateChange, startRec, hasPermission, handlePermissionError, handleError, isRecording]);

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
      handleError(error as string);
    }
  }, [stopRec, handleError, isRecording]);

  return (
    <AudioControls
      isRecording={isRecording}
      onStartRecording={handleStartRecording}
      onStopRecording={handleStopRecording}
      onFileUpload={handleFileUpload}
      onTranscriptionComplete={onTranscriptionComplete}
    />
  );
};

export default AudioRecorder;