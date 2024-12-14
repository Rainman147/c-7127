import { validateAudioFile } from './audioUtils';
import { supabase } from '@/integrations/supabase/client';

export const processAudioForTranscription = async (audioBlob: Blob): Promise<string> => {
  console.log('Processing audio for transcription with Gemini API');
  
  try {
    // Convert blob to array buffer for sending to Gemini
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    console.log('Sending audio data to Gemini API');
    const { data, error } = await supabase.functions.invoke('gemini', {
      body: { audioData: arrayBuffer }
    });

    if (error) {
      console.error('Transcription error:', error);
      throw error;
    }

    if (!data?.generatedText) {
      throw new Error('No transcription received');
    }

    return data.generatedText;
  } catch (error: any) {
    console.error('Audio processing error:', error);
    throw new Error(error.message || "Failed to process audio");
  }
};

export const startRecording = async (
  setMediaRecorder: (recorder: MediaRecorder) => void,
  setChunks: (chunks: Blob[]) => void,
  setIsRecording: (isRecording: boolean) => void,
  onError: (error: string) => void
) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    setMediaRecorder(recorder);
    setChunks(chunks);
    recorder.start();
    setIsRecording(true);

    // Auto-stop after 2 minutes
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
        setIsRecording(false);
        recorder.stream.getTracks().forEach(track => track.stop());
      }
    }, 120000);
  } catch (error: any) {
    onError("Could not access microphone. Please check permissions.");
    console.error('Error accessing microphone:', error);
  }
};

export const stopRecording = (
  mediaRecorder: MediaRecorder | null,
  setIsRecording: (isRecording: boolean) => void
) => {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
    setIsRecording(false);
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
};