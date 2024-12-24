import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useFunctionCalling } from "@/hooks/useFunctionCalling";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UseMessageSubmissionProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<any>;
  message: string;
  setMessage: (message: string) => void;
}

export const useMessageSubmission = ({ onSend, message, setMessage }: UseMessageSubmissionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleFunctionCall, isProcessing } = useFunctionCalling();
  const { activeSessionId, createSession } = useChatSessions();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || isProcessing || isCreatingSession) {
      return;
    }

    try {
      // Check authentication first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.error('[useMessageSubmission] Authentication error:', authError);
        toast({
          title: "Authentication Error",
          description: "Please sign in to send messages",
          variant: "destructive"
        });
        return;
      }

      console.log('[useMessageSubmission] Submitting message:', { 
        messageLength: message.length,
        activeSessionId 
      });

      const response = await onSend(message, 'text');
      
      if (response) {
        console.log('[useMessageSubmission] Message sent successfully:', response);
        setMessage(""); // Clear message only after successful send
      }
    } catch (error) {
      console.error('[useMessageSubmission] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    handleSubmit,
    isProcessing: isProcessing || isCreatingSession
  };
};