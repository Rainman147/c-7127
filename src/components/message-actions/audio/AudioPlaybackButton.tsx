import { Volume2, Loader2, Square } from "lucide-react";

interface AudioPlaybackButtonProps {
  isLoading: boolean;
  isPlaying: boolean;
  onClick: () => void;
}

export const AudioPlaybackButton = ({ isLoading, isPlaying, onClick }: AudioPlaybackButtonProps) => {
  return (
    <button 
      className={`p-1 transition-colors ${isPlaying ? 'text-blue-500' : 'hover:text-white'}`}
      onClick={onClick}
      disabled={isLoading}
      aria-label={isPlaying ? "Stop audio playback" : "Play text as audio"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <Square className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  );
};