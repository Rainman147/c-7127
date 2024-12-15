import { Mic, Square } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import FileUploadModal from './FileUploadModal';

interface AudioControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (file: File) => void;
  onTranscriptionComplete: (text: string) => void;
}

const AudioControls = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  onTranscriptionComplete
}: AudioControlsProps) => {
  return (
    <div className="flex gap-2">
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
    </div>
  );
};

export default AudioControls;