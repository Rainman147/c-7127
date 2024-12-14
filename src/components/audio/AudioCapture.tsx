import { useState, useRef } from 'react';
import { useAudioContext } from '@/hooks/useAudioContext';
import { useAudioStreamManager } from './capture/AudioStreamManager';

interface AudioCaptureProps {
  onRecordingComplete: (blob: Blob) => void;
}

const AudioCapture = ({ onRecordingComplete }: AudioCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingTimeout = useRef<NodeJS.Timeout>();
  const { initializeAudioContext, cleanupAudioContext } = useAudioContext();
  const MAX_RECORDING_TIME = 120000; // 2 minutes in milliseconds
  const chunks = useRef<Blob[]>([]);

  const handleStreamStart = (stream: MediaStream) => {
    const { source } = initializeAudioContext(stream);
    
    mediaRecorder.current = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });
    
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.current.push(e.data);
      }
    };

    mediaRecorder.current.onstop = () => {
      if (chunks.current.length > 0) {
        const finalBlob = new Blob(chunks.current, { type: 'audio/webm' });
        console.log('Final recording blob size:', finalBlob.size);
        onRecordingComplete(finalBlob);
        chunks.current = [];
      }
    };

    mediaRecorder.current.start();
    setIsRecording(true);
    console.log('Started recording');

    recordingTimeout.current = setTimeout(() => {
      if (isRecording) {
        stopRecording();
      }
    }, MAX_RECORDING_TIME);
  };

  const { startStream, stopStream } = useAudioStreamManager({
    onStreamStart: handleStreamStart,
    onStreamError: () => setIsRecording(false),
    onStreamStop: () => {
      cleanupAudioContext();
      setIsRecording(false);
    }
  });

  const startRecording = async () => {
    chunks.current = []; // Reset chunks array
    await startStream();
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    
    if (recordingTimeout.current) {
      clearTimeout(recordingTimeout.current);
    }

    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }

    stopStream();
    setIsRecording(false);
    console.log('Recording stopped');
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default AudioCapture;