import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import AudioProgressTracker from './processing/AudioProgressTracker';
import { useChunkProcessor } from './processing/ChunkProcessor';

interface AudioProcessorProps {
  audioBlob: Blob | null;
  onProcessingComplete: (text: string) => void;
  onProcessingEnd: () => void;
}

const CHUNK_SIZE = 30 * 1000; // 30 seconds in milliseconds

const AudioProcessor = ({ 
  audioBlob, 
  onProcessingComplete, 
  onProcessingEnd 
}: AudioProcessorProps) => {
  const [processingStatus, setProcessingStatus] = useState('');
  const { toast } = useToast();

  const handleChunkProcessed = (transcription: string) => {
    onProcessingComplete(transcription);
  };

  const handleError = (error: Error) => {
    toast({
      title: "Processing Error",
      description: error.message || "Failed to process audio",
      variant: "destructive"
    });
  };

  const { 
    processChunks, 
    isProcessing, 
    currentChunk, 
    totalChunks 
  } = useChunkProcessor({
    onChunkProcessed: handleChunkProcessed,
    onError: handleError
  });

  useEffect(() => {
    let isMounted = true;

    const processAudio = async (blob: Blob) => {
      if (!isMounted) return;
      
      try {
        console.log('Starting audio processing with blob:', { 
          size: blob.size, 
          type: blob.type 
        });

        if (blob.size === 0) {
          throw new Error('Audio file is empty');
        }

        setProcessingStatus('Preparing audio for chunked processing...');

        // Split audio into chunks
        const chunks: Blob[] = [];
        let start = 0;

        while (start < blob.size) {
          const end = Math.min(start + CHUNK_SIZE, blob.size);
          chunks.push(blob.slice(start, end, blob.type));
          start = end;
        }

        console.log(`Split audio into ${chunks.length} chunks`);
        
        // Process chunks with metadata
        const processChunksWithMetadata = async (chunks: Blob[]) => {
          for (let i = 0; i < chunks.length; i++) {
            const formData = new FormData();
            formData.append('chunk', chunks[i]);
            formData.append('totalChunks', chunks.length.toString());
            await processChunks([chunks[i]]);
          }
        };

        await processChunksWithMetadata(chunks);
        
        setProcessingStatus('Processing complete!');
        console.log('Audio processing completed successfully');

      } catch (error: any) {
        if (!isMounted) return;
        handleError(error);
      } finally {
        if (isMounted) {
          setProcessingStatus('');
          onProcessingEnd();
        }
      }
    };

    if (audioBlob && !isProcessing) {
      console.log('Processing new audio blob:', { 
        size: audioBlob.size, 
        type: audioBlob.type 
      });
      processAudio(audioBlob);
    }

    return () => {
      isMounted = false;
    };
  }, [audioBlob, onProcessingComplete, onProcessingEnd, processChunks, isProcessing, toast]);

  return (
    <AudioProgressTracker
      isProcessing={isProcessing}
      currentChunk={currentChunk}
      totalChunks={totalChunks}
      status={processingStatus}
    />
  );
};

export default AudioProcessor;