import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRecordingSession } from './useRecordingSession';
import { useChunkUpload } from './useChunkUpload';
import { useAudioStreamSetup } from './useAudioStreamSetup';
import { useMediaRecorderSetup } from './useMediaRecorderSetup';
import { supabase } from '@/integrations/supabase/client';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { createSession, clearSession, getSessionId } = useRecordingSession();
  const { uploadChunk } = useChunkUpload();
  
  const handleDataAvailable = useCallback(async (event: BlobEvent) => {
    if (event.data.size > 0) {
      const sessionId = getSessionId();
      console.log('[useRecording] Recording chunk received:', {
        size: event.data.size,
        type: event.data.type,
        sessionId,
        isRecording: mediaRecorderRef.current?.state
      });
      
      chunksRef.current.push(event.data);
      const chunkNumber = chunksRef.current.length;

      try {
        await uploadChunk(event.data, sessionId, chunkNumber);
        console.log(`[useRecording] Chunk ${chunkNumber} uploaded successfully`);
      } catch (error: any) {
        console.error('[useRecording] Error handling audio chunk:', error);
        onError(error.message);
      }
    }
  }, [getSessionId, uploadChunk, onError]);

  const { setupMediaRecorder, mediaRecorderRef } = useMediaRecorderSetup({
    onDataAvailable: handleDataAvailable,
    onError
  });

  const { setupAudioStream, cleanupStream } = useAudioStreamSetup();

  const startRec = useCallback(async () => {
    try {
      // Clear any existing chunks
      chunksRef.current = [];
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      const sessionId = createSession();
      console.log('[useRecording] Starting recording with session:', sessionId);

      const stream = await setupAudioStream();
      const recorder = setupMediaRecorder(stream);

      // Start recording with a reasonable chunk interval
      console.log('[useRecording] Starting MediaRecorder...');
      recorder.start(5000); // Chunk every 5 seconds
      setIsRecording(true);

      console.log('[useRecording] MediaRecorder configured with:', {
        state: recorder.state,
        sessionId,
        userId: user.id
      });

    } catch (error: any) {
      console.error('[useRecording] Failed to start recording:', error);
      onError(error.message);
      cleanupStream();
      setIsRecording(false);
      
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  }, [createSession, setupAudioStream, setupMediaRecorder, cleanupStream, onError, toast]);

  const stopRec = useCallback(async () => {
    const sessionId = getSessionId();
    console.log('[useRecording] Stopping recording session:', sessionId);
    
    if (mediaRecorderRef.current?.state === 'recording') {
      console.log('[useRecording] Stopping MediaRecorder');
      mediaRecorderRef.current.stop();
    }

    cleanupStream();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[useRecording] User not authenticated');
      onError('User not authenticated');
      return;
    }

    if (!sessionId || chunksRef.current.length === 0) {
      console.warn('[useRecording] No chunks recorded or no active session');
      onError('No audio recorded');
      return;
    }

    try {
      console.log('[useRecording] Processing transcription');
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe-chunks', {
        body: { 
          sessionId,
          userId: user.id
        }
      });

      if (transcriptionError) throw transcriptionError;

      if (transcriptionData?.transcription) {
        console.log('[useRecording] Transcription complete:', transcriptionData.transcription);
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
      console.error('[useRecording] Error stopping recording:', error);
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
      setIsRecording(false);
    }
  }, [getSessionId, cleanupStream, onError, onTranscriptionComplete, clearSession, toast]);

  return {
    isRecording,
    startRecording: startRec,
    stopRecording: stopRec
  };
};