import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useCallback, useEffect } from 'react';
import { defaultTemplates } from '@/types/templates/defaults';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';

export const useSessionParams = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const templateId = searchParams.get('template') || 'live-session';

  const {
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    matchingTemplate
  } = useMemo(() => {
    logger.debug(LogCategory.ROUTING, 'useSessionParams', 'Validating route parameters:', {
      sessionId,
      templateId,
      timestamp: new Date().toISOString()
    });

    const isNewSession = !sessionId;
    const isValidSessionId = sessionId ? /^[0-9a-fA-F-]+$/.test(sessionId) : false;
    
    const matchingTemplate = defaultTemplates.find(t => t.id === templateId);
    const isValidTemplateId = templateId ? (
      !!matchingTemplate || /^[0-9a-fA-F-]+$/.test(templateId)
    ) : false;

    if (!isValidSessionId && sessionId) {
      logger.warn(LogCategory.ROUTING, 'useSessionParams', 'Invalid session ID detected:', {
        sessionId,
        timestamp: new Date().toISOString()
      });
    }

    return {
      isNewSession,
      isValidSessionId,
      isValidTemplateId,
      matchingTemplate
    };
  }, [sessionId, templateId]);

  // Monitor route parameter validity
  useEffect(() => {
    if (!isValidSessionId && sessionId) {
      logger.warn(LogCategory.ROUTING, 'useSessionParams', 'Invalid session detected, redirecting to home');
      toast({
        title: "Invalid Session",
        description: "The requested chat session could not be found.",
        variant: "destructive"
      });
      navigate('/', { replace: true });
    }

    if (!isValidTemplateId) {
      logger.warn(LogCategory.ROUTING, 'useSessionParams', 'Invalid template detected, using default');
      toast({
        title: "Invalid Template",
        description: "Using default template instead.",
        variant: "default"
      });
    }
  }, [isValidSessionId, isValidTemplateId, sessionId, navigate, toast]);

  const redirectToSession = useCallback((id: string, params?: { template?: string }) => {
    const targetTemplateId = params?.template || templateId;
    const currentSearchParams = new URLSearchParams(searchParams);
    const currentTemplate = currentSearchParams.get('template');
    
    if (id !== sessionId || targetTemplateId !== currentTemplate) {
      logger.info(LogCategory.ROUTING, 'useSessionParams', 'Redirecting to session:', { 
        id, 
        params,
        currentTemplate: templateId,
        targetTemplate: targetTemplateId,
        timestamp: new Date().toISOString()
      });
      
      const newSearchParams = new URLSearchParams();
      if (!params?.template && templateId) {
        newSearchParams.set('template', templateId);
      } else if (params?.template) {
        newSearchParams.set('template', params.template);
      }

      const queryString = newSearchParams.toString();
      const newPath = `/c/${id}${queryString ? `?${queryString}` : ''}`;
      navigate(newPath, { replace: true });
    }
  }, [navigate, searchParams, sessionId, templateId]);

  const redirectToNew = useCallback((params?: { template?: string }) => {
    const targetTemplateId = params?.template || templateId;
    logger.info(LogCategory.ROUTING, 'useSessionParams', 'Redirecting to new session with params:', {
      params,
      currentTemplate: templateId,
      targetTemplate: targetTemplateId,
      timestamp: new Date().toISOString()
    });
    
    const newSearchParams = new URLSearchParams();
    if (!params?.template && templateId) {
      newSearchParams.set('template', templateId);
    } else if (params?.template) {
      newSearchParams.set('template', params.template);
    }

    const queryString = newSearchParams.toString();
    const newPath = `/${queryString ? `?${queryString}` : ''}`;
    navigate(newPath, { replace: true });
  }, [navigate, templateId]);

  return {
    sessionId: isValidSessionId ? sessionId : null,
    templateId: isValidTemplateId ? templateId : 'live-session',
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    matchingTemplate,
    redirectToNew,
    redirectToSession
  };
};