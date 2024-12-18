import { useAudioPlayer } from './audio/useAudioPlayer';
import { AudioPlaybackButton } from "./audio/AudioPlaybackButton";

export const AudioButton = ({ content }: { content: string }) => {
  const {
    isLoading,
    isPlaying,
    isProcessing,
    handlePlayback
  } = useAudioPlayer(content);

  return (
    <AudioPlaybackButton 
      isLoading={isLoading}
      isPlaying={isPlaying}
      onClick={handlePlayback}
      disabled={isProcessing && !isPlaying}
    />
  );
};