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
  const { toast } = useToast();

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

        setIsProcessing(true);
        setProgress(0);
        setProcessingStatus('Preparing audio for transcription...');

        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });

        reader.readAsDataURL(blob);
        const base64Data = await base64Promise;
        
        console.log('Audio converted to base64, length:', base64Data.length);
        setProgress(25);
        setProcessingStatus('Sending audio to Whisper API...');

        const { data, error } = await supabase.functions.invoke('transcribe', {
          body: { 
            audioData: base64Data,
            mimeType: blob.type
          }
        });

        if (!isMounted) return;

        if (error) {
          console.error('Transcription error:', error);
          throw new Error(error.message || 'Failed to transcribe audio');
        }

        if (!data?.transcription) {
          throw new Error('No transcription received');
        }

        console.log('Transcription received:', data.transcription);
        setProgress(100);
        setProcessingStatus('Transcription complete!');
        onProcessingComplete(data.transcription);

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
    />
  ) : null;
};

export default AudioProcessor;