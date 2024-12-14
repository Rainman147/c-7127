import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateAudioFile } from '@/utils/audioUtils';
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
  const { toast } = useToast();

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus('Preparing audio for transcription...');

    try {
      validateAudioFile(blob);
      
      // Create FormData with the audio blob
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      console.log('Sending audio for transcription...');
      setProgress(25);
      setProcessingStatus('Sending audio to transcription service...');

      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: formData
      });

      if (error) {
        console.error('Transcription error:', error);
        throw new Error(error.message || 'Failed to transcribe audio');
      }

      if (!data?.transcription) {
        throw new Error('No transcription received');
      }

      setProgress(100);
      setProcessingStatus('Transcription complete!');
      onProcessingComplete(data.transcription);

    } catch (error: any) {
      console.error('Audio processing error:', error);
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process audio",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStatus('');
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
    />
  ) : null;
};

export default AudioProcessor;