import { Mic, Square, Upload } from 'lucide-react';
import { Tooltip } from './ui/tooltip';

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
      <Tooltip content={isRecording ? "Stop recording" : "Start recording"}>
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`p-2 rounded-full transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <Square className="h-5 w-5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-gray-700" />
          )}
        </button>
      </Tooltip>
      
      <Tooltip content="Upload audio file">
        <button
          onClick={onFileUpload}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          aria-label="Upload audio file"
        >
          <Upload className="h-5 w-5 text-gray-700" />
        </button>
      </Tooltip>
    </div>
  );
};

export default AudioControls;