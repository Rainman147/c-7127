import { useState } from "react";
import { Copy, Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/utils/clipboard";
import { AudioButton } from "@/components/message-actions/AudioButton";
import type { MessageActionsProps } from "@/types/chat";

const MessageActions = ({ content, isAIMessage }: MessageActionsProps) => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null);

  const handleCopy = async () => {
    try {
      await copyToClipboard(content);
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy message to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        className="p-1 hover:text-white transition-colors"
        onClick={handleCopy}
      >
        <Copy className="h-4 w-4" />
      </button>
      {isAIMessage && (
        <AudioButton 
          content={content}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          audioRef={audioRef}
        />
      )}
    </div>
  );
};

export default MessageActions;