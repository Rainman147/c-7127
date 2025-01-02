import { useState, useRef } from 'react';
import { AudioButton } from './actions/AudioButton';
import { CopyButton } from './actions/CopyButton';

interface MessageActionsProps {
  content: string;
  isAIMessage: boolean;
}

const MessageActions = ({ content, isAIMessage }: MessageActionsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="flex items-center space-x-2">
      {isAIMessage && (
        <AudioButton 
          content={content} 
          isPlaying={isPlaying} 
          setIsPlaying={setIsPlaying} 
          audioRef={audioRef} 
        />
      )}
      <CopyButton content={content} />
    </div>
  );
};

export default MessageActions;