import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useToast } from "@/hooks/use-toast";
import { logger, LogCategory } from '@/utils/logging';

export const useSessionManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const { activeSessionId, createSession } = useChatSessions();

  const ensureActiveSession = useCallback(async () => {
    const startTime = performance.now();
    
    logger.info(LogCategory.STATE, 'useSessionManagement', 'Checking active session:', { 
      activeSessionId, 
      isCreatingSession,
      timestamp: new Date().toISOString()
    });
    
    if (!activeSessionId && !isCreatingSession) {
      logger.info(LogCategory.STATE, 'useSessionManagement', 'Creating new session');
      setIsCreatingSession(true);
      
      try {
        const templateType = searchParams.get('template') || 'live-patient-session';
        const sessionId = await createSession('New Chat', templateType);
        
        if (sessionId) {
          const duration = performance.now() - startTime;
          logger.info(LogCategory.STATE, 'useSessionManagement', 'Session created successfully:', { 
            sessionId, 
            templateType,
            duration: `${duration.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          });
          
          const queryParams = new URLSearchParams();
          if (templateType) {
            queryParams.set('template', templateType);
          }
          const queryString = queryParams.toString();
          const newPath = `/c/${sessionId}${queryString ? `?${queryString}` : ''}`;
          
          logger.debug(LogCategory.ROUTING, 'useSessionManagement', 'Navigating to:', {
            path: newPath,
            timestamp: new Date().toISOString()
          });
          navigate(newPath);
          return sessionId;
        }
      } catch (error) {
        logger.error(LogCategory.ERROR, 'useSessionManagement', 'Failed to create session:', {
          error,
          stack: error instanceof Error ? error.stack : undefined,
          duration: `${(performance.now() - startTime).toFixed(2)}ms`
        });
        toast({
          title: "Error",
          description: "Failed to create new chat session",
          variant: "destructive"
        });
        return null;
      } finally {
        setIsCreatingSession(false);
      }
    }
    return activeSessionId;
  }, [activeSessionId, isCreatingSession, createSession, navigate, searchParams, toast]);

  return {
    isCreatingSession,
    ensureActiveSession
  };
};