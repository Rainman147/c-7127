import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useToast } from "@/hooks/use-toast";

export const useSessionManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const { activeSessionId, createSession } = useChatSessions();

  const ensureActiveSession = useCallback(async () => {
    console.log('[useSessionManagement] Checking active session:', { activeSessionId, isCreatingSession });
    
    if (!activeSessionId && !isCreatingSession) {
      console.log('[useSessionManagement] Creating new session');
      setIsCreatingSession(true);
      
      try {
        const templateType = searchParams.get('template') || 'live-patient-session';
        const sessionId = await createSession('New Chat', templateType);
        
        if (sessionId) {
          console.log('[useSessionManagement] Session created successfully:', { sessionId, templateType });
          
          const queryParams = new URLSearchParams();
          if (templateType) {
            queryParams.set('template', templateType);
          }
          const queryString = queryParams.toString();
          const newPath = `/c/${sessionId}${queryString ? `?${queryString}` : ''}`;
          
          console.log('[useSessionManagement] Navigating to:', newPath);
          navigate(newPath);
          return true;
        }
      } catch (error) {
        console.error('[useSessionManagement] Failed to create session:', error);
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
  }, [activeSessionId, isCreatingSession, createSession, navigate, searchParams, toast]);

  return {
    isCreatingSession,
    ensureActiveSession
  };
};