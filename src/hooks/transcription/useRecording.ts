import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();
  const chunks: Blob[] = [];

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          console.log('Recording stopped, blob created:', { size: audioBlob.size });

          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            console.log('Sending audio data to transcription service...');
            const { data, error } = await supabase.functions.invoke('transcribe', {
              body: { 
                audioData: base64Audio,
                mimeType: 'audio/webm'
              }
            });

            if (error) {
              console.error('Transcription error:', error);
              onError(error.message);
              return;
            }

            if (data?.transcription) {
              console.log('Transcription received:', data.transcription);
              onTranscriptionComplete(data.transcription);
            } else {
              onError('No transcription received from the service');
            }
          };

          reader.onerror = () => {
            console.error('Error reading audio file:', reader.error);
            onError('Failed to process audio file');
          };

          reader.readAsDataURL(audioBlob);
        } catch (error: any) {
          console.error('Error processing recording:', error);
          onError(error.message || 'Failed to process recording');
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      console.log('Started recording with enhanced audio settings');

    } catch (error: any) {
      console.error('Error starting recording:', error);
      onError('Could not access microphone. Please check permissions.');
    }
  }, [onError, onTranscriptionComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('Stopping recording...');
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};