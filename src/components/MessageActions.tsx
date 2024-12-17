import { useState } from "react";
import { ThumbsUp, ThumbsDown, RotateCcw, MoreHorizontal } from "lucide-react";
import { AudioButton } from "./message-actions/AudioButton";
import { CopyButton } from "./message-actions/CopyButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessageActionsProps = {
  content: string;
  messageId: string;
};

const MessageActions = ({ content, messageId }: MessageActionsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const audioRef = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleFeedback = async (type: 'positive' | 'negative') => {
    try {
      console.log(`Submitting ${type} feedback for message:`, messageId);
      
      if (type === 'negative') {
        setShowFeedbackDialog(true);
        setFeedbackGiven(type);
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase.from('feedback').insert({
        message_id: messageId,
        user_id: user?.id,
        feedback_type: type,
      });

      if (error) throw error;

      setFeedbackGiven(type);
      toast({
        title: "Thank you for your feedback!",
        duration: 2000,
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error submitting feedback",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const submitNegativeFeedback = async () => {
    try {
      console.log('Submitting negative feedback with comment:', feedbackComment);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase.from('feedback').insert({
        message_id: messageId,
        user_id: user?.id,
        feedback_type: 'negative',
        comments: feedbackComment,
      });

      if (error) throw error;

      setShowFeedbackDialog(false);
      setFeedbackComment("");
      toast({
        title: "Thank you for your feedback!",
        duration: 2000,
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error submitting feedback",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 text-gray-400">
        <AudioButton 
          content={content}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          audioRef={audioRef}
        />
        <button 
          className={`p-1 transition-colors ${
            feedbackGiven === 'positive' 
              ? 'text-green-500 hover:text-green-600' 
              : 'hover:text-white'
          }`}
          onClick={() => handleFeedback('positive')}
          aria-label="Positive feedback"
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button 
          className={`p-1 transition-colors ${
            feedbackGiven === 'negative' 
              ? 'text-red-500 hover:text-red-600' 
              : 'hover:text-white'
          }`}
          onClick={() => handleFeedback('negative')}
          aria-label="Negative feedback"
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
        <CopyButton content={content} />
        <button className="p-1 hover:text-white transition-colors">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button className="p-1 hover:text-white transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What could be improved?</DialogTitle>
            <DialogDescription>
              Your feedback helps us improve our responses.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Please share your thoughts..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitNegativeFeedback}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageActions;