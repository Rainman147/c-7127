import { useToast } from '@/hooks/use-toast';

export const useRecordingToasts = () => {
  const { toast } = useToast();

  const showStartRecordingToast = () => {
    toast({
      title: "Recording Started",
      description: "Recording session is now active",
      duration: 3000,
    });
  };

  const showStopRecordingToast = () => {
    toast({
      title: "Recording Stopped",
      description: "Processing your audio...",
      duration: 3000,
    });
  };

  const showErrorToast = (error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive"
    });
  };

  return {
    showStartRecordingToast,
    showStopRecordingToast,
    showErrorToast
  };
};