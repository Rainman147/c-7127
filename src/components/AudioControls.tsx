import { Mic, Square, Upload } from 'lucide-react';

interface AudioControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: () => void;
}

const AudioControls = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onFileUpload
}: AudioControlsProps) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`p-2 rounded-full transition-colors ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <Square className="h-5 w-5 text-white" />
        ) : (
          <Mic className="h-5 w-5 text-gray-700" />
        )}
      </button>
      
      <button
        onClick={onFileUpload}
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        title="Upload audio file"
      >
        <Upload className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  );
};

export default AudioControls;