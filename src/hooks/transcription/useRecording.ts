import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRecordingSession } from './useRecordingSession';
import { useChunkUpload } from './useChunkUpload';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceType } from '@/utils/deviceDetection';

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
  const { isIOS } = getDeviceType();
  
  const handleDataAvailable = useCallback(async (event: BlobEvent) => {
    if (event.data.size > 0) {
      const sessionId = getSessionId();
      console.log('[useRecording] Recording chunk received:', {
        size: event.data.size,
        type: event.data.type,
        sessionId
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

  const startRec = useCallback(async () => {
    try {
      // Clear any existing chunks
      chunksRef.current = [];
      
      const sessionId = createSession();
      console.log('[useRecording] Starting recording with session:', sessionId);

      // Configure audio constraints based on device
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: isIOS ? 44100 : 16000, // iOS requires 44.1kHz
      };

      console.log('[useRecording] Requesting media with constraints:', audioConstraints);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints
      });

      // Verify we have an active audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('No audio track available');
      }
      console.log('[useRecording] Audio track obtained:', audioTrack.label);

      // Set up MediaRecorder with appropriate MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      console.log('[useRecording] Using MIME type:', mimeType);

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      // Set up event handlers before starting
      recorder.ondataavailable = handleDataAvailable;
      
      recorder.onerror = (event: ErrorEvent) => {
        console.error('[useRecording] MediaRecorder error:', event.error);
        onError('Recording failed: ' + (event.error?.message || 'Unknown error'));
        stopRec();
      };

      recorder.onstart = () => {
        console.log('[useRecording] MediaRecorder started successfully');
        setIsRecording(true);
      };

      recorder.onstop = () => {
        console.log('[useRecording] MediaRecorder stopped');
        setIsRecording(false);
      };

      // Start recording with a reasonable chunk interval
      recorder.start(5000); // Chunk every 5 seconds
      mediaRecorderRef.current = recorder;

      console.log('[useRecording] MediaRecorder configured with:', {
        mimeType,
        audioBitsPerSecond: 128000,
        sessionId
      });

    } catch (error: any) {
      console.error('[useRecording] Failed to start recording:', error);
      onError(error.message);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  }, [createSession, handleDataAvailable, onError, toast, isIOS]);

  const stopRec = useCallback(async () => {
    const sessionId = getSessionId();
    console.log('[useRecording] Stopping recording session:', sessionId);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('[useRecording] Stopping MediaRecorder');
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        console.log('[useRecording] Stopping track:', track.label);
        track.stop();
      });
    }

    // Wait a short moment to ensure all chunks are processed
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!sessionId || chunksRef.current.length === 0) {
      console.warn('[useRecording] No chunks recorded or no active session');
      onError('No audio recorded');
      return;
    }

    try {
      console.log('[useRecording] Sending chunks for transcription');
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe-chunks', {
        body: { 
          sessionId,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (transcriptionError) {
        console.error('[useRecording] Transcription error:', transcriptionError);
        throw transcriptionError;
      }

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