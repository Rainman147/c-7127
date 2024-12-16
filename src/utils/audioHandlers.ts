import { validateAudioFile } from './audioUtils';
import { supabase } from '@/integrations/supabase/client';

// Constants for audio processing
const CHUNK_DURATION = 1000; // 1 second chunks
const SAMPLE_RATE = 16000; // Required by Gemini API
const CHANNELS = 1; // Mono audio

export const processAudioForTranscription = async (audioBlob: Blob, language = "en-US"): Promise<string> => {
  console.log('Processing audio for transcription with enhanced Gemini API features');
  
  try {
    // Convert blob to base64 for sending to Gemini
    const buffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(buffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    console.log('Sending audio data to Gemini API with language:', language);
    const { data, error } = await supabase.functions.invoke('gemini', {
      body: { 
        audioData: base64Audio,
        language: language
      }
    });

    if (error) {
      console.error('Transcription error:', error);
      throw error;
    }

    if (!data?.transcription) {
      throw new Error('No transcription received');
    }

    // Format the transcription with speaker labels and timestamps
    const formattedTranscription = data.transcription
      .map((segment: any) => 
        `[${segment.speaker} at ${segment.startTime}s]: ${segment.text}`
      )
      .join('\n');

    console.log('Transcription completed with metadata:', data.metadata);
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
    // Request high-quality audio with noise suppression
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: SAMPLE_RATE,
        channelCount: CHANNELS
      } 
    });

    // Create AudioContext for preprocessing
    const audioContext = new AudioContext({
      sampleRate: SAMPLE_RATE,
      latencyHint: 'interactive'
    });
    
    // Create source node from stream
    const source = audioContext.createMediaStreamSource(stream);
    
    // Create preprocessing nodes
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 100;
    
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;
    
    // Connect audio processing nodes
    source
      .connect(noiseFilter)
      .connect(compressor);
    
    // Create MediaRecorder with processed audio
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    });
    
    const chunks: Blob[] = [];
    let lastChunkTime = Date.now();

    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
        
        // Process chunk if enough time has passed
        const now = Date.now();
        if (now - lastChunkTime >= CHUNK_DURATION) {
          const chunk = new Blob(chunks, { type: 'audio/webm' });
          try {
            const transcription = await processAudioForTranscription(chunk);
            console.log('Chunk transcription:', transcription);
          } catch (error) {
            console.error('Chunk processing error:', error);
          }
          chunks.length = 0; // Clear processed chunks
          lastChunkTime = now;
        }
      }
    };

    setMediaRecorder(recorder);
    setChunks(chunks);
    recorder.start(CHUNK_DURATION); // Start recording in 1-second chunks
    setIsRecording(true);
    
    console.log('Recording started with continuous mode');
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
    console.log('Recording stopped by user');
  }
};