import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionManagement } from './useSessionManagement';
import { useChunkProcessing } from './useChunkProcessing';
import { convertWebMToWav } from '@/utils/audio/conversion';
import { useToast } from '@/hooks/use-toast';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();
  const { recordingSessionId, createSession, clearSession, handleSessionError } = useSessionManagement();
  const { processChunk } = useChunkProcessing();

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using supported MIME type:', type);
        return type;
      }
    }
    
    console.warn('No preferred MIME types supported, falling back to browser default');
    return '';
  };

  const handleDataAvailable = useCallback(async (data: Blob) => {
    console.log('Recording chunk received:', {
      size: data.size,
      type: data.type,
      sessionId: recordingSessionId
    });

    if (!recordingSessionId) {
      console.error('No active recording session');
      return;
    }

    try {
      await processChunk(data, recordingSessionId);
    } catch (error: any) {
      console.error('Error handling audio chunk:', error);
      onError(error.message);
    }
  }, [recordingSessionId, processChunk, onError]);

  const startRec = useCallback(async () => {
    try {
      const sessionId = createSession();
      console.log('Starting new recording session:', sessionId);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      setCurrentStream(stream);
      
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          handleDataAvailable(e.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError('Recording failed');
      };

      mediaRecorder.start(5000); // Chunk every 5 seconds
      console.log('MediaRecorder started with mime type:', mimeType);

    } catch (error: any) {
      console.error('Failed to start recording:', error);
      handleSessionError(error);
      onError(error.message);
      
      // Clean up any partial stream if there was an error
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        setCurrentStream(null);
      }
    }
  }, [createSession, handleDataAvailable, handleSessionError, onError]);

  const stopRec = useCallback(async () => {
    console.log('Stopping recording session:', recordingSessionId);
    
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }

    if (!recordingSessionId) {
      console.warn('No active session to stop');
      return;
    }

    try {
      const { data: chunks, error: fetchError } = await supabase
        .from('audio_chunks')
        .select('*')
        .eq('storage_path', `chunks/${recordingSessionId}/%`)
        .order('chunk_number', { ascending: true });

      if (fetchError) throw fetchError;

      if (!chunks || chunks.length === 0) {
        throw new Error('No audio chunks found for transcription');
      }

      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe-chunks', {
        body: { sessionId: recordingSessionId }
      });

      if (transcriptionError) throw transcriptionError;

      if (transcriptionData?.transcription) {
        console.log('Transcription complete');
        onTranscriptionComplete(transcriptionData.transcription);
      }

    } catch (error: any) {
      console.error('Error stopping recording:', error);
      onError(error.message);
    } finally {
      clearSession();
    }
  }, [recordingSessionId, currentStream, clearSession, onError, onTranscriptionComplete]);

  return {
    isRecording: Boolean(currentStream),
    startRecording: startRec,
    stopRecording: stopRec
  };
};