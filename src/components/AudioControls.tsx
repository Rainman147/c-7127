import { memo } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { getDeviceType, getBrowserType } from '@/utils/deviceDetection';

interface AudioControlsProps {
  isRecording: boolean;
  isInitializing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (file: File) => void;
  onTranscriptionComplete: (text: string) => void;
}

const RecordingIndicator = memo(() => (
  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
    <span className="hidden sm:inline">Recording in session</span>
    <span className="inline sm:hidden">Recording</span>
    <span className="flex gap-0.5">
      <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </span>
  </div>
));

RecordingIndicator.displayName = 'RecordingIndicator';

const AudioControls = memo(({
  isRecording,
  isInitializing,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  onTranscriptionComplete
}: AudioControlsProps) => {
  console.log('[AudioControls] Rendering with states:', { isRecording, isInitializing });
  
  const { isIOS } = getDeviceType();
  const { isSafari, isChrome } = getBrowserType();
  console.log('[AudioControls] Device detection:', { isIOS, isSafari, isChrome });

  const getTooltipContent = () => {
    if (isInitializing) return "Initializing...";
    if (isRecording) return "Stop recording";
    if (isIOS) {
      if (isChrome) return "Tap to start recording (Chrome iOS)";
      if (isSafari) return "Tap to start recording (Safari iOS)";
    }
    return "Start recording";
  };

  const handleRecordingClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('[AudioControls] Record button clicked, current states:', { isRecording, isInitializing });
    
    if (isInitializing) {
      console.log('[AudioControls] Ignoring click while initializing');
      return;
    }

    try {
      if (isRecording) {
        console.log('[AudioControls] Stopping recording...');
        await onStopRecording();
      } else {
        console.log('[AudioControls] Starting recording...');
        await onStartRecording();
      }
    } catch (error) {
      console.error('[AudioControls] Error handling recording:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleRecordingClick}
              className={`p-2 rounded-full transition-all duration-300 ${
                isInitializing 
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-white hover:bg-gray-100 dark:bg-gray-200 dark:hover:bg-gray-300'
              }`}
              disabled={isInitializing}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              type="button"
            >
              {isInitializing ? (
                <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
              ) : isRecording ? (
                <Square className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {isRecording && <RecordingIndicator />}
    </div>
  );
});

AudioControls.displayName = 'AudioControls';

export default AudioControls;