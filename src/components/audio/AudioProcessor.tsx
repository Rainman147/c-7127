import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ProcessingIndicator from '../ProcessingIndicator';
import { supabase } from '@/integrations/supabase/client';

interface AudioProcessorProps {
  audioBlob: Blob | null;
  onProcessingComplete: (text: string) => void;
  onProcessingEnd: () => void;
}

const AudioProcessor = ({ 
  audioBlob, 
  onProcessingComplete, 
  onProcessingEnd 
}: AudioProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const { toast } = useToast();
  const CHUNK_SIZE = 30 * 1000; // 30 seconds in milliseconds

  useEffect(() => {
    let isMounted = true;

    const processChunk = async (chunk: Blob): Promise<string> => {
      try {
        console.log('Processing chunk:', { size: chunk.size, type: chunk.type });
        
        // Convert chunk to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });

        reader.readAsDataURL(chunk);
        const base64Data = await base64Promise;
        
        console.log('Chunk converted to base64, length:', base64Data.length);

        const { data, error } = await supabase.functions.invoke('transcribe', {
          body: { 
            audioData: base64Data,
            mimeType: chunk.type
          }
        });

        if (error) {
          console.error('Transcription error:', error);
          throw new Error(error.message || 'Failed to transcribe audio chunk');
        }

        if (!data?.transcription) {
          throw new Error('No transcription received for chunk');
        }

        return data.transcription;
      } catch (error: any) {
        console.error('Chunk processing error:', error);
        throw error;
      }
    };

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

        setIsProcessing(true);
        setProgress(0);
        setProcessingStatus('Preparing audio for chunked processing...');

        // Split audio into chunks
        const duration = CHUNK_SIZE; // 30 seconds per chunk
        const chunks: Blob[] = [];
        let start = 0;

        while (start < blob.size) {
          const end = Math.min(start + duration, blob.size);
          chunks.push(blob.slice(start, end, blob.type));
          start = end;
        }

        setTotalChunks(chunks.length);
        console.log(`Split audio into ${chunks.length} chunks`);

        let transcription = '';
        for (let i = 0; i < chunks.length; i++) {
          if (!isMounted) return;

          setCurrentChunk(i + 1);
          setProgress((i / chunks.length) * 100);
          setProcessingStatus(`Processing chunk ${i + 1} of ${chunks.length}...`);

          const chunkTranscription = await processChunk(chunks[i]);
          transcription += (transcription ? ' ' : '') + chunkTranscription;
          
          // Update transcription incrementally
          onProcessingComplete(transcription);
        }

        setProgress(100);
        setProcessingStatus('Processing complete!');
        console.log('Audio processing completed successfully');

      } catch (error: any) {
        if (!isMounted) return;
        
        console.error('Audio processing error:', error);
        toast({
          title: "Processing Error",
          description: error.message || "Failed to process audio",
          variant: "destructive"
        });
      } finally {
        if (isMounted) {
          setIsProcessing(false);
          setProgress(0);
          setProcessingStatus('');
          setCurrentChunk(0);
          setTotalChunks(0);
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
  }, [audioBlob, onProcessingComplete, onProcessingEnd, toast]);

  return isProcessing ? (
    <ProcessingIndicator
      progress={progress}
      status={processingStatus}
      currentChunk={currentChunk}
      totalChunks={totalChunks}
    />
  ) : null;
};

export default AudioProcessor;