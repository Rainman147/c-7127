import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useFunctionCalling } from "@/hooks/useFunctionCalling";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useNavigate, useSearchParams } from 'react-router-dom';

interface UseMessageSubmissionProps {
  onSend: (message: string, type?: 'text' | 'audio') => void;
}

export const useMessageSubmission = ({ onSend }: UseMessageSubmissionProps) => {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleFunctionCall, isProcessing } = useFunctionCalling();
  const { activeSessionId, createSession } = useChatSessions();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const ensureActiveSession = async () => {
    if (!activeSessionId && !isCreatingSession) {
      console.log('[useMessageSubmission] Creating new session for first message');
      setIsCreatingSession(true);
      
      try {
        const templateType = searchParams.get('template') || 'live-patient-session';
        const sessionId = await createSession('New Chat', templateType);
        if (sessionId) {
          console.log('[useMessageSubmission] New session created:', sessionId);
          
          // Preserve template parameter when creating new session
          const queryParams = new URLSearchParams();
          if (templateType) {
            queryParams.set('template', templateType);
          }
          const queryString = queryParams.toString();
          navigate(`/c/${sessionId}${queryString ? `?${queryString}` : ''}`);
          return true;
        }
      } catch (error) {
        console.error('[useMessageSubmission] Failed to create session:', error);
        toast({
          title: "Error",
          description: "Failed to create new chat session",
          variant: "destructive"
        });
        return false;
      } finally {
        setIsCreatingSession(false);
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (message.trim() && !isProcessing) {
      const sessionCreated = await ensureActiveSession();
      if (sessionCreated) {
        onSend(message, 'text');
        setMessage("");
      }
    }
  };

  return {
    message,
    setMessage,
    handleSubmit,
    isProcessing: isProcessing || isCreatingSession
  };
};