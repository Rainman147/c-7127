import { FileAudio, Mic } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

interface ActionButtonsProps {
  onTranscriptionComplete: (text: string) => void;
}

const ActionButtons = ({ onTranscriptionComplete }: ActionButtonsProps) => {
  const handleRecordingStateChange = (isRecording: boolean) => {
    console.log('Recording state changed:', isRecording);
  };

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mt-8">
      <div className="flex flex-col items-center gap-2">
        <AudioRecorder 
          onTranscriptionComplete={onTranscriptionComplete}
          onRecordingStateChange={handleRecordingStateChange}
        />
        <span>Record Audio</span>
      </div>
      <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-chatgpt-hover hover:bg-chatgpt-selected transition-colors">
        <FileAudio className="h-6 w-6" />
        <span>Upload Audio</span>
      </button>
    </div>
  );
};

export default ActionButtons;