import { useState, useRef } from 'react';
import { Mic, Square, Loader2, Upload } from 'lucide-react';
import { Progress } from './ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const SUPPORTED_FORMATS = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file format
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      toast({
        title: "Unsupported Format",
        description: "Please upload an audio file in WAV, MP3, or M4A format.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "Please upload an audio file smaller than 25MB.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus('Preparing audio file...');

    try {
      await processAudioChunk(file);
    } catch (error: any) {
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process audio file",
        variant: "destructive"
      });
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const processAudioChunk = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setProgress(25);
    setProcessingStatus('Transcribing audio...');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      setProgress(50);
      
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: formData,
      });

      if (error) throw error;
      
      setProgress(100);
      setProcessingStatus('Transcription complete');
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
      setProcessingStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {isProcessing ? (
        <div className="flex items-center gap-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <div className="flex flex-col gap-1 min-w-[200px]">
            <Progress value={progress} className="h-2" />
            {processingStatus && (
              <span className="text-xs text-gray-500">{processingStatus}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <Square className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-gray-700" />
            )}
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            title="Upload audio file"
          >
            <Upload className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;