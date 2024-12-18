import { memo } from 'react';
import { Volume2, Loader2, Square } from "lucide-react";
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { cn } from '@/lib/utils';

interface AudioButtonProps {
  content: string;
  className?: string;
}

export const AudioButton = memo(({ content, className }: AudioButtonProps) => {
  const { isLoading, isPlaying, handlePlayback } = useAudioPlayer({
    onError: (error) => {
      console.error('[AudioButton] Playback error:', error);
    }
  });

  const handleClick = () => {
    if (isPlaying) {
      console.log('[AudioButton] Stopping playback');
    } else {
      console.log('[AudioButton] Starting playback');
    }
    handlePlayback(content);
  };

  return (
    <button 
      className={cn(
        "p-1 transition-colors",
        isPlaying ? "text-blue-500" : "hover:text-white",
        className
      )}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isPlaying ? "Stop audio playback" : "Play text as audio"}
      title={isPlaying ? "Stop playback" : "Play as audio"}
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
});

AudioButton.displayName = 'AudioButton';