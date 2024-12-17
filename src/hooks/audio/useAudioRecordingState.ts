import { useState, useCallback } from 'react';

interface AudioRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  progress: number;
  currentChunk: number;
  totalChunks: number;
}

export const useAudioRecordingState = () => {
  const [state, setState] = useState<AudioRecordingState>({
    isRecording: false,
    isProcessing: false,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0
  });

  const updateState = useCallback((newState: Partial<AudioRecordingState>) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      isRecording: false,
      isProcessing: false,
      progress: 0,
      currentChunk: 0,
      totalChunks: 0
    });
  }, []);

  return {
    ...state,
    updateState,
    resetState
  };
};