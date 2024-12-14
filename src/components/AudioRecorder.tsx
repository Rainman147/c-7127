import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import AudioControls from './AudioControls';
import AudioProcessor from './audio/AudioProcessor';
import FileUploader from './audio/FileUploader';
import RecordingManager from './audio/RecordingManager';
import ProcessingIndicator from './ProcessingIndicator';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete, onTranscriptionUpdate }: AudioRecorderProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const fileUploaderRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  
  const handleTranscriptionError = async (error: any) => {
    console.error('Transcription error:', error);
    
    if (retryCount < MAX_RETRIES) {
      setIsReconnecting(true);
      toast({
        title: "Connection lost",
        description: `Attempting to reconnect... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
        variant: "default",
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      setRetryCount(prev => prev + 1);
      return true; // Indicate that we should retry
    }
    
    setIsReconnecting(false);
    setRetryCount(0);
    toast({
      title: "Error",
      description: "Failed to transcribe audio after multiple attempts. Please try again.",
      variant: "destructive",
    });
    return false; // Indicate that we should not retry
  };
  
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
            const newTranscription = result.transcription.trim();
            setLiveTranscription(prev => {
              const updated = prev + (prev ? ' ' : '') + newTranscription;
              onTranscriptionUpdate?.(updated);
              return updated;
            });
          }
          
          // Reset retry count on successful transcription
          if (retryCount > 0) {
            setRetryCount(0);
            setIsReconnecting(false);
            toast({
              title: "Connection restored",
              description: "Transcription has resumed successfully.",
              variant: "default",
            });
          }
        }
      } catch (error) {
        console.error('Transcription error:', error);
        const shouldRetry = await handleTranscriptionError(error);
        
        if (shouldRetry) {
          // Retry sending the same audio data
          onAudioData(data);
        } else {
          // Stop recording if max retries reached
          stopRecording();
        }
      }
    }
  });

  useEffect(() => {
    if (!isRecording && liveTranscription) {
      onTranscriptionComplete(liveTranscription.trim());
      setLiveTranscription('');
      setRetryCount(0);
      setIsReconnecting(false);
    }
  }, [isRecording, liveTranscription, onTranscriptionComplete]);

  const handleFileUpload = () => {
    fileUploaderRef.current?.click();
  };

  return (
    <div className="flex items-center gap-4">
      <FileUploader onFileSelected={setAudioBlob} />
      
      {(isProcessing || isReconnecting) && (
        <ProcessingIndicator
          progress={0}
          status={isReconnecting ? "Reconnecting..." : "Processing audio..."}
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