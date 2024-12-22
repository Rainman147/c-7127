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

  const handleSubmit = async () => {
    if (message.trim() && !isProcessing) {
      try {
        // If no active session, we'll create one after successful AI response
        const templateType = searchParams.get('template') || 'live-patient-session';
        
        // Send message and get AI response
        const response = await onSend(message, 'text');
        
        // If successful and no active session, create one and update URL
        if (response && !activeSessionId && !isCreatingSession) {
          console.log('[useMessageSubmission] Creating new session after successful AI response');
          setIsCreatingSession(true);
          
          try {
            const sessionId = await createSession('New Chat', templateType);
            if (sessionId) {
              console.log('[useMessageSubmission] New session created:', sessionId);
              
              const queryParams = new URLSearchParams();
              if (templateType) {
                queryParams.set('template', templateType);
              }
              const queryString = queryParams.toString();
              navigate(`/c/${sessionId}${queryString ? `?${queryString}` : ''}`);
            }
          } finally {
            setIsCreatingSession(false);
          }
        }
        
        setMessage("");
      } catch (error) {
        console.error('[useMessageSubmission] Error processing message:', error);
        toast({
          title: "Error",
          description: "Failed to process message",
          variant: "destructive"
        });
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