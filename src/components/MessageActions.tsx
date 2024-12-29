import { useState, useRef } from "react";
import { ThumbsUp, ThumbsDown, RotateCcw, MoreHorizontal, Pencil } from "lucide-react";
import { AudioButton } from "./message-actions/AudioButton";
import { CopyButton } from "./message-actions/CopyButton";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type MessageActionsProps = {
  content: string;
  messageId?: string;
  onEdit?: () => void;
  onRetry?: () => void;
  isFailed?: boolean;
};

const MessageActions = ({ 
  content, 
  messageId, 
  onEdit,
  onRetry,
  isFailed 
}: MessageActionsProps) => {
  console.log('[MessageActions] Rendering actions');
  
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'none' | 'liked' | 'disliked'>('none');
  const audioRef = useState<HTMLAudioElement | null>(null);
  
  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (!messageId) {
      console.warn('[MessageActions] Cannot submit feedback without messageId');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[MessageActions] User not authenticated');
        toast({
          title: "Error",
          description: "You must be logged in to submit feedback",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('feedback')
        .insert({
          message_id: messageId,
          user_id: user.id,
          feedback_type: type === 'like' ? 'positive' : 'negative'
        });

      if (error) throw error;

      setFeedbackState(type === 'like' ? 'liked' : 'disliked');
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });

    } catch (error) {
      console.error('[MessageActions] Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex items-center gap-2 text-gray-400">
      <AudioButton 
        content={content}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        audioRef={audioRef}
      />
      <button 
        className={`p-1 hover:text-white transition-colors ${feedbackState === 'liked' ? 'text-green-500' : ''}`}
        onClick={() => handleFeedback('like')}
        disabled={feedbackState !== 'none'}
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button 
        className={`p-1 hover:text-white transition-colors ${feedbackState === 'disliked' ? 'text-red-500' : ''}`}
        onClick={() => handleFeedback('dislike')}
        disabled={feedbackState !== 'none'}
      >
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
      {isFailed && onRetry && (
        <button 
          className="p-1 hover:text-white transition-colors text-red-400 hover:text-red-300"
          onClick={() => {
            console.log('[MessageActions] Retry button clicked');
            onRetry();
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
      <button className="p-1 hover:text-white transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MessageActions;