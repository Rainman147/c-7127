import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { startRecording, stopRecording } from '@/utils/audioHandlers';

interface RecordingManagerProps {
  onRecordingComplete: (blob: Blob) => void;
}

const RecordingManager = ({ onRecordingComplete }: RecordingManagerProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    await startRecording(
      (recorder) => mediaRecorder.current = recorder,
      (newChunks) => chunks.current = newChunks,
      setIsRecording,
      (error) => toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    );
  };

  const handleStopRecording = () => {
    stopRecording(mediaRecorder.current, setIsRecording);
    if (chunks.current.length > 0) {
      const audioBlob = new Blob(chunks.current, { type: 'audio/wav' });
      onRecordingComplete(audioBlob);
      chunks.current = [];
    }
  };

  return {
    isRecording,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording
  };
};

export default RecordingManager;