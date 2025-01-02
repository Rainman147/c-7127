import { AudioButton } from './actions/AudioButton';
import { CopyButton } from './actions/CopyButton';

const MessageActions = ({ content, isPlaying, setIsPlaying, audioRef }) => {
  return (
    <div className="flex items-center space-x-2">
      <AudioButton 
        content={content} 
        isPlaying={isPlaying} 
        setIsPlaying={setIsPlaying} 
        audioRef={audioRef} 
      />
      <CopyButton content={content} />
    </div>
  );
};

export default MessageActions;
