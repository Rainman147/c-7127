import { useState } from 'react';
import ProcessingIndicator from '../../ProcessingIndicator';

interface AudioProgressTrackerProps {
  isProcessing: boolean;
  currentChunk: number;
  totalChunks: number;
  status: string;
}

const AudioProgressTracker = ({
  isProcessing,
  currentChunk,
  totalChunks,
  status
}: AudioProgressTrackerProps) => {
  const progress = totalChunks > 0 ? (currentChunk / totalChunks) * 100 : 0;

  return isProcessing ? (
    <ProcessingIndicator
      progress={progress}
      status={status}
      currentChunk={currentChunk}
      totalChunks={totalChunks}
    />
  ) : null;
};

export default AudioProgressTracker;