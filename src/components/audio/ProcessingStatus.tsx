import ProcessingIndicator from '@/features/chat/components/audio/ProcessingIndicator';

interface ProcessingStatusProps {
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
}

const ProcessingStatus = ({ progress, currentChunk, totalChunks }: ProcessingStatusProps) => {
  console.log('[ProcessingStatus] Rendering with:', {
    progress,
    currentChunk,
    totalChunks
  });

  return (
    <ProcessingIndicator
      progress={progress}
      status="Processing audio..."
      currentChunk={currentChunk}
      totalChunks={totalChunks}
    />
  );
};

export default ProcessingStatus;