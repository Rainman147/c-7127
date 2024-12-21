import { useToast } from "@/hooks/use-toast";

interface UseTranscriptionHandlerProps {
  onTranscriptionComplete: (text: string) => void;
  setMessage: (text: string) => void;
}

export const useTranscriptionHandler = ({
  onTranscriptionComplete,
  setMessage
}: UseTranscriptionHandlerProps) => {
  const { toast } = useToast();

  const handleTranscriptionComplete = (transcription: string) => {
    console.log('[useTranscriptionHandler] Transcription complete:', transcription);
    setMessage(transcription);
    onTranscriptionComplete(transcription);
    
    toast({
      title: "Transcription complete",
      description: "Your audio has been transcribed. Review and edit before sending.",
      duration: 3000,
    });
  };

  const handleFileUpload = async (file: File) => {
    console.log('[useTranscriptionHandler] File uploaded:', file);
  };

  return {
    handleTranscriptionComplete,
    handleFileUpload
  };
};