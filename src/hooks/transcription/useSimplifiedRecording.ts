import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecordingState } from './useAudioRecordingState';
import { getDeviceType } from '@/utils/deviceDetection';

interface RecordingHookProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export const useSimplifiedRecording = ({ 
  onTranscriptionComplete, 
  onError 
}: RecordingHookProps) => {
  const { toast } = useToast();
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const { isIOS } = getDeviceType();
  const {
    isRecording,
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    updateState,
    resetState
  } = useAudioRecordingState();

  const startRecording = useCallback(async () => {
    try {
      console.log('[useSimplifiedRecording] Starting recording with device type:', { isIOS });
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(isIOS && {
            sampleRate: 44100,
            channelCount: 1
          })
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[useSimplifiedRecording] Got media stream:', stream.getAudioTracks()[0].label);

      chunks.current = [];

      const options: MediaRecorderOptions = {
        mimeType: isIOS ? 'audio/mp4' : 'audio/webm',
        audioBitsPerSecond: 128000
      };

      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(`[useSimplifiedRecording] Using supported MIME type: ${options.mimeType}`);
      } else {
        console.log('[useSimplifiedRecording] Falling back to default MIME type');
        delete options.mimeType;
      }

      mediaRecorder.current = new MediaRecorder(stream, options);

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
          console.log('[useSimplifiedRecording] Received chunk:', e.data.size, 'bytes');
        }
      };

      // Set a timeout to stop recording after 10 minutes
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
          toast({
            title: "Recording limit reached",
            description: "Maximum recording duration of 10 minutes reached.",
            duration: 3000,
          });
        }
      }, 600000);

      mediaRecorder.current.start(1000);
      updateState({ isRecording: true });
      console.log('[useSimplifiedRecording] Started recording');
    } catch (error) {
      console.error('[useSimplifiedRecording] Error starting recording:', error);
      onError('Failed to start recording. Please check microphone permissions.');
    }
  }, [isRecording, onError, toast, updateState, isIOS]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorder.current) {
      console.error('No active recording session');
      return;
    }

    try {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      updateState({ isRecording: false, isProcessing: true });

      const sessionId = crypto.randomUUID();
      console.log('Processing audio with session:', sessionId);

      const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
      console.log('Processing audio blob:', { size: audioBlob.size });

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(audioBlob);
      const base64Data = await base64Promise;

      updateState({ progress: 50 });

      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audioData: base64Data,
          mimeType: 'audio/webm',
          sessionId
        }
      });

      if (error) {
        console.error('Processing error:', error);
        throw error;
      }

      if (data?.transcription) {
        console.log('Transcription completed:', data.transcription.substring(0, 50) + '...');
        onTranscriptionComplete(data.transcription);
      } else {
        throw new Error('No transcription received');
      }

    } catch (error: any) {
      console.error('Error processing recording:', error);
      onError('Failed to process recording. Please try again.');
    } finally {
      resetState();
      chunks.current = [];
    }
  }, [onTranscriptionComplete, onError, updateState, resetState]);

  return {
    isRecording,
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    startRecording,
    stopRecording
  };
};
