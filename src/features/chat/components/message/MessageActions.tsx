
import { useState, useRef } from 'react';
import { AudioButton } from './actions/AudioButton';
import { CopyButton } from './actions/CopyButton';

interface MessageActionsProps {
  content: string;
  isAssistant: boolean;
}

const MessageActions = ({ content, isAssistant }: MessageActionsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="flex items-center space-x-2 mt-2">
      {isAssistant && (
        <AudioButton 
          content={content} 
          isPlaying={isPlaying} 
          setIsPlaying={setIsPlaying} 
          audioRef={[audioRef.current, (audio) => { audioRef.current = audio }]} 
        />
      )}
      <CopyButton content={content} />
    </div>
  );
};

export default MessageActions;
