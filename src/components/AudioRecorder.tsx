import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import AudioControls from './AudioControls';
import AudioProcessor from './audio/AudioProcessor';
import FileUploader from './audio/FileUploader';
import RecordingManager from './audio/RecordingManager';
import ProcessingIndicator from './ProcessingIndicator';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const fileUploaderRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const {
    isRecording,
    startRecording,
    stopRecording
  } = RecordingManager({
    onRecordingComplete: setAudioBlob,
    onAudioData: async (data) => {
      try {
        if (data) {
          console.log('Sending audio chunk for transcription');
          const response = await fetch('https://hlnzunnahksudbotqvpk.supabase.co/functions/v1/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              audioData: data,
              mimeType: 'audio/x-raw',
              streaming: true
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to transcribe audio');
          }

          const result = await response.json();
          console.log('Transcription result:', result);
          
          if (result.transcription) {
            setLiveTranscription(prev => prev + ' ' + result.transcription.trim());
          }
        }
      } catch (error) {
        console.error('Transcription error:', error);
        toast({
          title: 'Error',
          description: 'Failed to transcribe audio. Please try again.',
          variant: 'destructive',
        });
      }
    }
  });

  useEffect(() => {
    if (!isRecording && liveTranscription) {
      onTranscriptionComplete(liveTranscription.trim());
      setLiveTranscription('');
    }
  }, [isRecording, liveTranscription, onTranscriptionComplete]);

  const handleFileUpload = () => {
    fileUploaderRef.current?.click();
  };

  return (
    <div className="flex items-center gap-4">
      <FileUploader onFileSelected={setAudioBlob} />
      
      {isProcessing && (
        <ProcessingIndicator
          progress={0}
          status="Processing audio..."
        />
      )}
      
      <AudioProcessor
        audioBlob={audioBlob}
        onProcessingComplete={onTranscriptionComplete}
        onProcessingEnd={() => {
          setAudioBlob(null);
          setIsProcessing(false);
        }}
      />
      
      <AudioControls
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default AudioRecorder;