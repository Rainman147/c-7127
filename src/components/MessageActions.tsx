import { useState, useRef } from "react";
import { ThumbsUp, ThumbsDown, RotateCcw, MoreHorizontal, Pencil } from "lucide-react";
import { AudioButton } from "./message-actions/AudioButton";
import { CopyButton } from "./message-actions/CopyButton";
import MessageActionButton from "./message/actions/MessageActionButton";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';

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
  logger.debug(LogCategory.RENDER, 'MessageActions', 'Rendering actions:', {
    messageId,
    isFailed,
    hasEdit: !!onEdit,
    hasRetry: !!onRetry
  });
  
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'none' | 'liked' | 'disliked'>('none');
  const audioRef = useState<HTMLAudioElement | null>(null);
  
  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (!messageId) {
      logger.warn(LogCategory.STATE, 'MessageActions', 'Cannot submit feedback without messageId');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.error(LogCategory.ERROR, 'MessageActions', 'User not authenticated');
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
      logger.error(LogCategory.ERROR, 'MessageActions', 'Error submitting feedback:', error);
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
      <MessageActionButton 
        icon={ThumbsUp}
        onClick={() => handleFeedback('like')}
        disabled={feedbackState !== 'none'}
        active={feedbackState === 'liked'}
        activeClassName="text-green-500"
      />
      <MessageActionButton 
        icon={ThumbsDown}
        onClick={() => handleFeedback('dislike')}
        disabled={feedbackState !== 'none'}
        active={feedbackState === 'disliked'}
        activeClassName="text-red-500"
      />
      <CopyButton content={content} />
      {onEdit && (
        <MessageActionButton 
          icon={Pencil}
          onClick={() => {
            logger.debug(LogCategory.STATE, 'MessageActions', 'Edit button clicked');
            onEdit();
          }}
        />
      )}
      {isFailed && onRetry && (
        <MessageActionButton 
          icon={RotateCcw}
          onClick={() => {
            logger.debug(LogCategory.STATE, 'MessageActions', 'Retry button clicked');
            onRetry();
          }}
          className="text-red-400 hover:text-red-300"
        />
      )}
      <MessageActionButton 
        icon={MoreHorizontal}
        onClick={() => {}}
      />
    </div>
  );
};

export default MessageActions;