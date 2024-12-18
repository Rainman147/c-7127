import { useAudioPlayback } from "./audio/useAudioPlayback";
import { AudioPlaybackButton } from "./audio/AudioPlaybackButton";
import type { AudioButtonProps } from './types';

export const AudioButton = ({ content }: AudioButtonProps) => {
  const { isLoading, isPlaying, handleTextToSpeech } = useAudioPlayback();
  
  return (
    <AudioPlaybackButton 
      isLoading={isLoading}
      isPlaying={isPlaying}
      onClick={() => handleTextToSpeech(content)}
    />
  );
};