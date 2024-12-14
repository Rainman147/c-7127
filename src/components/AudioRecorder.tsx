import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/wav' });
        await processAudioChunk(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setProgress(0);

      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (mediaRecorder.current?.state === 'recording') {
          stopRecording();
        }
      }, 120000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudioChunk = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setProgress(25);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      setProgress(50);
      
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: formData,
      });

      if (error) throw error;
      
      setProgress(100);
      onTranscriptionComplete(data.text);
    } catch (error: any) {
      toast({
        title: "Transcription Error",
        description: error.message || "Failed to transcribe audio",
        variant: "destructive"
      });
      console.error('Transcription error:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {isProcessing ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <div className="w-32">
            <Progress value={progress} className="h-2" />
          </div>
        </>
      ) : (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-full transition-colors ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {isRecording ? (
            <Square className="h-5 w-5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-gray-700" />
          )}
        </button>
      )}
    </div>
  );
};

export default AudioRecorder;