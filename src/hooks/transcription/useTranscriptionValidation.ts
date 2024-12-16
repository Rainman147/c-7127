import { useToast } from '@/hooks/use-toast';

export const useTranscriptionValidation = (onTranscriptionComplete: (text: string) => void) => {
  const { toast } = useToast();

  const validateAndComplete = (text: string) => {
    console.log('Validating transcription:', text);
    
    if (!text || text.trim() === 'you' || text.trim().length < 2) {
      toast({
        title: "No Speech Detected",
        description: "Please try speaking more clearly or check your microphone",
        variant: "destructive"
      });
      return false;
    }

    onTranscriptionComplete(text);
    return true;
  };

  return validateAndComplete;
};