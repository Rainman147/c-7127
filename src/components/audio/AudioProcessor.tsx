import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateAudioFile, splitAudioIntoChunks, mergeTranscriptions } from '@/utils/audioUtils';
import { processAudioForTranscription } from '@/utils/audioHandlers';
import ProcessingIndicator from '../ProcessingIndicator';

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

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus('Processing audio...');

    try {
      const audioChunks = await splitAudioIntoChunks(blob);
      setTotalChunks(audioChunks.length);

      const transcriptions: string[] = [];
      
      for (let i = 0; i < audioChunks.length; i++) {
        setCurrentChunk(i + 1);
        setProcessingStatus(`Processing chunk ${i + 1} of ${audioChunks.length}...`);
        setProgress((i + 1) / audioChunks.length * 100);
        
        const result = await processAudioForTranscription(audioChunks[i]);
        transcriptions.push(result);
      }

      const finalTranscription = mergeTranscriptions(transcriptions);
      onProcessingComplete(finalTranscription);

    } catch (error: any) {
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process audio",
        variant: "destructive"
      });
      console.error('Audio processing error:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStatus('');
      setCurrentChunk(0);
      setTotalChunks(0);
      onProcessingEnd();
    }
  };

  // Start processing if audioBlob is provided
  if (audioBlob && !isProcessing) {
    processAudio(audioBlob);
  }

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