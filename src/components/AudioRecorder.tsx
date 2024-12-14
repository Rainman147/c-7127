import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateAudioFile, splitAudioIntoChunks, mergeTranscriptions } from '@/utils/audioUtils';
import { processAudioForTranscription, startRecording, stopRecording } from '@/utils/audioHandlers';
import AudioControls from './AudioControls';
import ProcessingIndicator from './ProcessingIndicator';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    await startRecording(
      (recorder) => mediaRecorder.current = recorder,
      (newChunks) => chunks.current = newChunks,
      setIsRecording,
      (error) => toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    );
  };

  const handleStopRecording = () => {
    stopRecording(mediaRecorder.current, setIsRecording);
    processRecordedAudio();
  };

  const processRecordedAudio = async () => {
    if (chunks.current.length === 0) return;
    
    const audioBlob = new Blob(chunks.current, { type: 'audio/wav' });
    await processAudioChunk(audioBlob);
  };

  const processAudioChunk = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus('Processing audio...');

    try {
      const transcription = await processAudioForTranscription(audioBlob);
      onTranscriptionComplete(transcription);
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
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus('Validating file...');

    try {
      validateAudioFile(file);
      
      setProcessingStatus('Preparing audio file...');
      const audioChunks = await splitAudioIntoChunks(file);
      setTotalChunks(audioChunks.length);

      const transcriptions: string[] = [];
      
      for (let i = 0; i < audioChunks.length; i++) {
        setCurrentChunk(i + 1);
        setProcessingStatus(`Processing chunk ${i + 1} of ${audioChunks.length}...`);
        setProgress((i + 1) / audioChunks.length * 100);
        
        const result = await processAudioForTranscription(audioChunks[i]);
        transcriptions.push(result);
      }

      const finalTranscription = mergeTranscriptions(transcriptions);
      onTranscriptionComplete(finalTranscription);

    } catch (error: any) {
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process audio file",
        variant: "destructive"
      });
      console.error('Audio processing error:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStatus('');
      setCurrentChunk(0);
      setTotalChunks(0);
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
        <ProcessingIndicator
          progress={progress}
          status={processingStatus}
          currentChunk={currentChunk}
          totalChunks={totalChunks}
        />
      ) : (
        <AudioControls
          isRecording={isRecording}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onFileUpload={() => fileInputRef.current?.click()}
        />
      )}
    </div>
  );
};

export default AudioRecorder;