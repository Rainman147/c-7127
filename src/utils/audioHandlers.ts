import { validateAudioFile } from './audioUtils';
import { supabase } from '@/integrations/supabase/client';

export const processAudioForTranscription = async (audioBlob: Blob): Promise<string> => {
  console.log('Processing audio for transcription with Gemini API');
  
  try {
    // Convert blob to base64 for sending to Gemini
    const buffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(buffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    console.log('Sending audio data to Gemini API');
    const { data, error } = await supabase.functions.invoke('gemini', {
      body: { audioData: base64Audio }
    });

    if (error) {
      console.error('Transcription error:', error);
      throw error;
    }

    if (!data?.transcription) {
      throw new Error('No transcription received');
    }

    // Format the transcription with speaker labels
    const formattedTranscription = data.transcription
      .map((segment: { speaker: string; text: string }) => 
        `${segment.speaker}: ${segment.text}`
      )
      .join('\n');

    return formattedTranscription;
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
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });
    
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    setMediaRecorder(recorder);
    setChunks(chunks);
    recorder.start(1000); // Start recording in 1-second chunks for real-time processing
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