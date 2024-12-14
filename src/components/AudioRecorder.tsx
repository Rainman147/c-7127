import { useState, useRef } from 'react';
import AudioControls from './AudioControls';
import AudioProcessor from './audio/AudioProcessor';
import FileUploader from './audio/FileUploader';
import ProcessingIndicator from './ProcessingIndicator';
import AudioCapture from './audio/AudioCapture';
import { useTranscription } from '@/hooks/useTranscription';
import { convertWebMToWav } from '@/utils/audioUtils';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete, onTranscriptionUpdate }: AudioRecorderProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileUploaderRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const transcriptionBuffer = useRef<string[]>([]);

  const { handleAudioData, isReconnecting } = useTranscription({
    onTranscriptionComplete: (text) => {
      console.log('Final transcription received:', text);
      // Clear the buffer after completing
      transcriptionBuffer.current = [];
      onTranscriptionComplete(text);
    },
    onTranscriptionUpdate: (text) => {
      console.log('Transcription update received:', text);
      if (text.trim()) {
        // Add new text to buffer
        transcriptionBuffer.current.push(text);
        // Send the accumulated text to update the input field
        if (onTranscriptionUpdate) {
          const fullText = transcriptionBuffer.current.join(' ');
          console.log('Sending accumulated transcription to input:', fullText);
          onTranscriptionUpdate(fullText);
        }
      }
    }
  });

  const handleBlobData = async (blob: Blob) => {
    try {
      console.log('Processing audio blob:', { size: blob.size, type: blob.type });
      setIsProcessing(true);
      
      const wavBlob = await convertWebMToWav(blob);
      console.log('Converted to WAV format:', { size: wavBlob.size, type: wavBlob.type });
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        await handleAudioData(base64data, wavBlob.type);
      };
      reader.onerror = (error) => {
        console.error('Error reading audio file:', error);
        toast({
          title: "Error",
          description: "Failed to process audio data",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(wavBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const audioCapture = AudioCapture({
    onRecordingComplete: setAudioBlob,
    onAudioData: handleBlobData
  });

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
        isRecording={audioCapture.isRecording}
        onStartRecording={audioCapture.startRecording}
        onStopRecording={audioCapture.stopRecording}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default AudioRecorder;