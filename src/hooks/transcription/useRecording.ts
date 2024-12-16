import { useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMediaRecorder } from './useMediaRecorder';
import { useAudioStream } from './useAudioStream';
import { convertWebMToWav } from '@/utils/audio/conversion';
import { useToast } from '@/hooks/use-toast';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [recordingSessionId, setRecordingSessionId] = useState<string>('');
  const [chunkCount, setChunkCount] = useState(0);
  const { getStream, cleanupStream } = useAudioStream();
  const { toast } = useToast();
  const chunks = useRef<Blob[]>([]);
  const estimatedTotalChunks = useRef(0);

  const handleDataAvailable = useCallback(async (data: Blob) => {
    console.log('Recording chunk received:', {
      size: data.size,
      type: data.type,
      timestamp: new Date().toISOString(),
      sessionId: recordingSessionId
    });
    
    chunks.current.push(data);
    console.log('Audio chunk captured:', data.size, 'bytes');
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Auth error:', userError);
        throw new Error('Authentication required for backup');
      }

      // Create FormData with all required fields
      const formData = new FormData();
      formData.append('chunk', data);
      formData.append('sessionId', recordingSessionId);
      formData.append('chunkNumber', chunkCount.toString());
      formData.append('totalChunks', estimatedTotalChunks.current.toString());
      formData.append('userId', user.id);

      console.log('Backing up chunk with data:', {
        sessionId: recordingSessionId,
        chunkNumber: chunkCount,
        totalChunks: estimatedTotalChunks.current,
        userId: user.id
      });

      const { error: backupError } = await supabase.functions.invoke('backup-audio-chunk', {
        body: formData
      });

      if (backupError) {
        console.warn('Failed to backup chunk:', backupError);
        toast({
          title: "Backup Warning",
          description: "Audio backup failed, but recording continues",
          variant: "default"
        });
      } else {
        setChunkCount(prev => prev + 1);
      }
    } catch (error) {
      console.warn('Error backing up chunk:', error);
    }
  }, [recordingSessionId, chunkCount, toast]);

  const handleError = useCallback((error: Error) => {
    console.error('Recording error:', error);
    if (currentStream) {
      cleanupStream(currentStream);
      setCurrentStream(null);
    }
    onError(error.message);
  }, [currentStream, cleanupStream, onError]);

  const { isRecording, startRecording, stopRecording } = useMediaRecorder({
    onDataAvailable: handleDataAvailable,
    onError: handleError
  });

  const startRec = useCallback(async () => {
    try {
      // Generate a new session ID before starting recording
      const newSessionId = crypto.randomUUID();
      console.log('Starting new recording session:', newSessionId);
      
      setRecordingSessionId(newSessionId);
      setChunkCount(0);
      chunks.current = [];
      estimatedTotalChunks.current = 6; // 30 seconds / 5 seconds per chunk
      
      const stream = await getStream();
      console.log('Audio stream obtained');
      
      setCurrentStream(stream);
      await startRecording(stream);
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      onError(error.message);
    }
  }, [getStream, startRecording, onError]);

  const stopRec = useCallback(async () => {
    console.log('Stopping recording and processing final data');
    stopRecording();
    
    if (currentStream) {
      cleanupStream(currentStream);
      setCurrentStream(null);
    }

    if (chunks.current.length === 0) {
      console.warn('No audio data recorded');
      return;
    }

    try {
      const completeAudio = new Blob(chunks.current, { type: 'audio/webm' });
      console.log('Combined audio size:', completeAudio.size);

      const wavBlob = await convertWebMToWav(completeAudio);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(wavBlob);
      const base64Data = await base64Promise;

      const { data: transcriptionData, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audioData: base64Data,
          mimeType: wavBlob.type
        }
      });

      if (error) {
        throw error;
      }

      if (transcriptionData?.transcription) {
        console.log('Transcription complete');
        onTranscriptionComplete(transcriptionData.transcription);
      }
    } catch (error: any) {
      console.error('Error processing recording:', error);
      toast({
        title: "Error",
        description: "Failed to process recording. Your audio has been backed up and can be recovered.",
        variant: "destructive",
      });
      onError(error.message);
    } finally {
      // Reset session state
      setRecordingSessionId('');
      setChunkCount(0);
      chunks.current = [];
    }
  }, [stopRecording, currentStream, cleanupStream, onTranscriptionComplete, onError, toast]);

  return {
    isRecording: Boolean(currentStream),
    startRecording: startRec,
    stopRecording: stopRec
  };
};