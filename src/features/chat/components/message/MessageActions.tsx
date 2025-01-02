import { memo } from 'react';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MessageActionsProps } from '@/types/chat';

const MessageActions = ({ content, isAIMessage }: MessageActionsProps) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied to your clipboard",
      });
    } catch (err) {
      console.error('Failed to copy message:', err);
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!isAIMessage) return null;

  return (
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-gray-700 rounded-md transition-colors"
        aria-label="Copy message"
      >
        <Copy className="h-4 w-4 text-gray-400" />
      </button>
    </div>
  );
};

export default memo(MessageActions);