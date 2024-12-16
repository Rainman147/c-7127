import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRecordingSession } from './useRecordingSession';
import { useChunkUpload } from './useChunkUpload';
import { supabase } from '@/integrations/supabase/client';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { createSession, clearSession, getSessionId } = useRecordingSession();
  const { uploadChunk } = useChunkUpload();
  
  const handleDataAvailable = useCallback(async (event: BlobEvent) => {
    if (event.data.size > 0) {
      const sessionId = getSessionId();
      console.log('Recording chunk received:', {
        size: event.data.size,
        type: event.data.type,
        sessionId
      });
      
      chunksRef.current.push(event.data);
      const chunkNumber = chunksRef.current.length;

      try {
        await uploadChunk(event.data, sessionId, chunkNumber);
        console.log(`Chunk ${chunkNumber} uploaded successfully`);
      } catch (error: any) {
        console.error('Error handling audio chunk:', error);
        onError(error.message);
      }
    }
  }, [getSessionId, uploadChunk, onError]);

  const startRec = useCallback(async () => {
    try {
      // Clear any existing chunks
      chunksRef.current = [];
      
      const sessionId = createSession();
      console.log('Starting recording with session:', sessionId);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100
        } 
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      console.log('Using supported MIME type:', mimeType);

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      recorder.ondataavailable = handleDataAvailable;
      
      recorder.onerror = (event: Event) => {
        const error = (event.target as MediaRecorder).error;
        console.error('MediaRecorder error:', error);
        onError('Recording failed: ' + (error?.message || 'Unknown error'));
        stopRec();
      };

      recorder.start(5000); // Chunk every 5 seconds
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      console.log('MediaRecorder started with configuration:', {
        mimeType,
        audioBitsPerSecond: 128000,
        sessionId
      });

    } catch (error: any) {
      console.error('Failed to start recording:', error);
      onError(error.message);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  }, [createSession, handleDataAvailable, onError, toast]);

  const stopRec = useCallback(async () => {
    const sessionId = getSessionId();
    console.log('Stopping recording session:', sessionId);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    // Wait a short moment to ensure all chunks are processed
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!sessionId || chunksRef.current.length === 0) {
      console.warn('No chunks recorded or no active session');
      onError('No audio recorded');
      return;
    }

    try {
      // Transcribe the complete audio
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe-chunks', {
        body: { 
          sessionId,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (transcriptionError) {
        console.error('Transcription error:', transcriptionError);
        throw transcriptionError;
      }

      if (transcriptionData?.transcription) {
        console.log('Transcription complete:', transcriptionData.transcription);
        onTranscriptionComplete(transcriptionData.transcription);
        
        toast({
          title: "Success",
          description: "Audio transcribed successfully",
          duration: 3000,
        });
      } else {
        throw new Error('No transcription received');
      }

    } catch (error: any) {
      console.error('Error stopping recording:', error);
      onError(error.message);
      
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      chunksRef.current = [];
      clearSession();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [getSessionId, clearSession, onError, onTranscriptionComplete, toast]);

  return {
    isRecording,
    startRecording: startRec,
    stopRecording: stopRec
  };
};