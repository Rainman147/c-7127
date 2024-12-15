import { Mic, Square } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface AudioControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (file: File) => void;
  onTranscriptionComplete: (text: string) => void;
}

const RecordingIndicator = () => (
  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
    <span>Recording in session</span>
    <span className="flex gap-0.5">
      <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </span>
  </div>
);

const AudioControls = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  onTranscriptionComplete
}: AudioControlsProps) => {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`p-2 rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
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
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRecording ? "Stop recording" : "Start recording"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {isRecording && <RecordingIndicator />}
    </div>
  );
};

export default AudioControls;