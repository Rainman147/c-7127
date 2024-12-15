import { useState, useRef } from 'react';
import AudioControls from './AudioControls';
import AudioProcessor from './audio/AudioProcessor';
import FileUploader from './audio/FileUploader';
import ProcessingIndicator from './ProcessingIndicator';
import AudioCapture from './audio/AudioCapture';
import BlobProcessor from './audio/BlobProcessor';
import WAVConverter from './audio/WAVConverter';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileUploaderRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleBlobData = async (blob: Blob) => {
    console.log('Converting audio to WAV format...');
    const handleWAVBlob = (wavBlob: Blob) => {
      console.log('WAV conversion complete:', { size: wavBlob.size, type: wavBlob.type });
      setAudioBlob(wavBlob);
    };

    await WAVConverter({ blob, onConversionComplete: handleWAVBlob });
  };

  const audioCapture = AudioCapture({
    onRecordingComplete: handleBlobData
  });

  const handleFileUpload = () => {
    fileUploaderRef.current?.click();
  };

  // Process the audio blob when it's available
  const processAudioBlob = async (blob: Blob) => {
    try {
      const processor = new BlobProcessor({
        blob,
        onProcessingComplete: (text) => {
          onTranscriptionComplete(text);
          setAudioBlob(null);
        },
        onProcessingStart: () => setIsProcessing(true),
        onProcessingEnd: () => {
          setIsProcessing(false);
          setUploadProgress(0);
        }
      });

      await processor.processBlob(blob);
    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast({
        title: "Audio Processing Error",
        description: error.message || "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Process the audio blob when it changes
  if (audioBlob && !isProcessing) {
    processAudioBlob(audioBlob);
  }

  return (
    <div className="flex items-center gap-4">
      <FileUploader onFileSelected={setAudioBlob} />
      
      {isProcessing && (
        <ProcessingIndicator
          progress={uploadProgress}
          status={uploadProgress < 100 ? "Uploading audio..." : "Processing audio..."}
        />
      )}
      
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