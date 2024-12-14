import { useState, useRef } from 'react';
import AudioControls from './AudioControls';
import AudioProcessor from './audio/AudioProcessor';
import FileUploader from './audio/FileUploader';
import ProcessingIndicator from './ProcessingIndicator';
import AudioCapture from './audio/AudioCapture';
import BlobProcessor from './audio/BlobProcessor';
import WAVConverter from './audio/WAVConverter';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileUploaderRef = useRef<HTMLInputElement>(null);

  const handleBlobData = async (blob: Blob) => {
    const handleWAVBlob = (wavBlob: Blob) => {
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

  return (
    <div className="flex items-center gap-4">
      <FileUploader onFileSelected={setAudioBlob} />
      
      {isProcessing && (
        <ProcessingIndicator
          progress={uploadProgress}
          status={uploadProgress < 100 ? "Uploading audio..." : "Processing audio..."}
        />
      )}
      
      <BlobProcessor
        blob={audioBlob}
        onProcessingComplete={onTranscriptionComplete}
        onProcessingStart={() => setIsProcessing(true)}
        onProcessingEnd={() => {
          setAudioBlob(null);
          setIsProcessing(false);
          setUploadProgress(0);
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