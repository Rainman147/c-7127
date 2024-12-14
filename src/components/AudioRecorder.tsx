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
      
      // Validate input blob
      if (!blob.size) {
        throw new Error('Empty audio data received');
      }
      
      if (!blob.type.includes('audio/')) {
        throw new Error('Invalid audio format');
      }

      setIsProcessing(true);
      
      // Convert WebM to WAV if needed
      let processedBlob = blob;
      if (blob.type === 'audio/webm') {
        const audioContext = new AudioContext();
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Create WAV blob
        const wavBlob = await new Promise<Blob>((resolve) => {
          const numberOfChannels = audioBuffer.numberOfChannels;
          const length = audioBuffer.length * numberOfChannels * 2;
          const buffer = new ArrayBuffer(44 + length);
          const view = new DataView(buffer);
          
          // WAV header
          writeString(view, 0, 'RIFF');
          view.setUint32(4, 36 + length, true);
          writeString(view, 8, 'WAVE');
          writeString(view, 12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, numberOfChannels, true);
          view.setUint32(24, audioBuffer.sampleRate, true);
          view.setUint32(28, audioBuffer.sampleRate * numberOfChannels * 2, true);
          view.setUint16(32, numberOfChannels * 2, true);
          view.setUint16(34, 16, true);
          writeString(view, 36, 'data');
          view.setUint32(40, length, true);
          
          // Audio data
          const channelData = audioBuffer.getChannelData(0);
          let offset = 44;
          for (let i = 0; i < channelData.length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
          }
          
          resolve(new Blob([buffer], { type: 'audio/wav' }));
        });
        
        processedBlob = wavBlob;
        console.log('Converted WebM to WAV:', { size: processedBlob.size });
      }
      
      // Upload to Supabase Storage
      const fileName = `${Date.now()}.wav`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('audio_files')
        .upload(fileName, processedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'audio/wav'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload audio file');
      }

      console.log('Audio file uploaded successfully:', fileName);

      // Process audio using Edge Function
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { audioPath: fileName }
      });

      if (error) {
        console.error('Processing error:', error);
        throw error;
      }

      if (data?.transcription) {
        console.log('Transcription received:', data.transcription);
        onTranscriptionComplete(data.transcription);
      } else {
        throw new Error('No transcription received from the server');
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

  // Helper function to write strings to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
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