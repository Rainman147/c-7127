import { useState, useRef } from "react";
import { ThumbsUp, ThumbsDown, RotateCcw, MoreHorizontal, Pencil } from "lucide-react";
import { AudioButton } from "./message-actions/AudioButton";
import { CopyButton } from "./message-actions/CopyButton";

type MessageActionsProps = {
  content: string;
  onEdit?: () => void;
};

const MessageActions = ({ content, onEdit }: MessageActionsProps) => {
  console.log('[MessageActions] Rendering actions');
  
  // Add state and ref for audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null);
  
  return (
    <div className="flex items-center gap-2 text-gray-400">
      <AudioButton 
        content={content}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        audioRef={audioRef}
      />
      <button className="p-1 hover:text-white transition-colors">
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button className="p-1 hover:text-white transition-colors">
        <ThumbsDown className="h-4 w-4" />
      </button>
      <CopyButton content={content} />
      {onEdit && (
        <button 
          className="p-1 hover:text-white transition-colors"
          onClick={() => {
            console.log('[MessageActions] Edit button clicked');
            onEdit();
          }}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      <button className="p-1 hover:text-white transition-colors">
        <RotateCcw className="h-4 w-4" />
      </button>
      <button className="p-1 hover:text-white transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MessageActions;