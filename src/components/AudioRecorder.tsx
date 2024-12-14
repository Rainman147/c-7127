import { useState, useRef } from 'react';
import AudioControls from './AudioControls';
import AudioProcessor from './audio/AudioProcessor';
import FileUploader from './audio/FileUploader';
import ProcessingIndicator from './ProcessingIndicator';
import AudioCapture from './audio/AudioCapture';
import { useTranscription } from '@/hooks/useTranscription';
import { convertWebMToWav } from '@/utils/audioUtils';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete, onTranscriptionUpdate }: AudioRecorderProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileUploaderRef = useRef<HTMLInputElement>(null);

  const { handleAudioData, isReconnecting } = useTranscription({
    onTranscriptionComplete,
    onTranscriptionUpdate: (text) => {
      console.log('Transcription update in AudioRecorder:', text);
      if (onTranscriptionUpdate && text.trim()) {
        onTranscriptionUpdate(text);
      }
    }
  });

  const handleBlobData = async (blob: Blob) => {
    try {
      console.log('Converting WebM blob to WAV...', { type: blob.type });
      const wavBlob = await convertWebMToWav(blob);
      console.log('Converting WAV blob to base64...', { type: wavBlob.type });
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        await handleAudioData(base64data, wavBlob.type);
      };
      reader.readAsDataURL(wavBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
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