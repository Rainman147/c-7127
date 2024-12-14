import { useState, useRef } from 'react';
import AudioControls from './AudioControls';
import AudioProcessor from './audio/AudioProcessor';
import FileUploader from './audio/FileUploader';
import ProcessingIndicator from './ProcessingIndicator';
import AudioCapture from './audio/AudioCapture';
import { useTranscription } from '@/hooks/useTranscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete, onTranscriptionUpdate }: AudioRecorderProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileUploaderRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleBlobData = async (blob: Blob) => {
    try {
      console.log('Processing audio blob:', { size: blob.size, type: blob.type });
      setIsProcessing(true);
      
      // Validate input blob
      if (!blob.size) {
        throw new Error('Empty audio data received');
      }
      
      if (!blob.type.includes('audio/')) {
        throw new Error('Invalid audio format');
      }

      // Upload to Supabase Storage
      const fileName = `${Date.now()}.webm`;
      
      // Create upload event handler
      const uploadEventHandler = (event: ProgressEvent) => {
        const percentage = (event.loaded / event.total) * 100;
        console.log('Upload progress:', percentage);
        setUploadProgress(percentage);
      };

      // Create XMLHttpRequest for tracking progress
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', uploadEventHandler);
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('audio_files')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload audio file');
      }

      console.log('Audio file uploaded successfully:', fileName);

      // Process audio using Edge Function
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: { audioPath: fileName }
      });

      if (error) {
        console.error('Processing error:', error);
        throw error;
      }

      if (data?.transcription) {
        console.log('Transcription received:', data.transcription);
        onTranscriptionComplete(data.transcription);
      }

    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast({
        title: "Audio Processing Error",
        description: error.message || "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
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
      
      {isProcessing && (
        <ProcessingIndicator
          progress={uploadProgress}
          status={uploadProgress < 100 ? "Uploading audio..." : "Processing audio..."}
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