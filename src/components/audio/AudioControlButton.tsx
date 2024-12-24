import { memo } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Tooltip, TooltipProvider } from '../ui/tooltip';
import { getDeviceType, getBrowserType } from '@/utils/deviceDetection';

interface AudioControlButtonProps {
  isRecording: boolean;
  isInitializing: boolean;
  isProcessing: boolean;
  onClick: (event: React.MouseEvent) => void;
}

const AudioControlButton = memo(({ 
  isRecording, 
  isInitializing, 
  isProcessing, 
  onClick 
}: AudioControlButtonProps) => {
  const { isIOS } = getDeviceType();
  const { isSafari, isChrome } = getBrowserType();

  const getTooltipContent = () => {
    if (isInitializing) return "Initializing...";
    if (isProcessing) return "Processing audio...";
    if (isRecording) return "Stop recording";
    if (isIOS) {
      if (isChrome) return "Tap to start recording (Chrome iOS)";
      if (isSafari) return "Tap to start recording (Safari iOS)";
    }
    return "Start recording";
  };

  return (
    <TooltipProvider>
      <Tooltip content={getTooltipContent()}>
        <button
          onClick={onClick}
          className={`p-2 rounded-full transition-all duration-300 ${
            isInitializing || isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-white hover:bg-gray-100 dark:bg-gray-200 dark:hover:bg-gray-300'
          }`}
          disabled={isInitializing || isProcessing}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          type="button"
        >
          {isInitializing || isProcessing ? (
            <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
          ) : isRecording ? (
            <Square className="h-5 w-5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-gray-700" />
          )}
        </button>
      </Tooltip>
    </TooltipProvider>
  );
});

AudioControlButton.displayName = 'AudioControlButton';

export default AudioControlButton;