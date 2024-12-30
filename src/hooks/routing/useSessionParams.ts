import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { defaultTemplates } from '@/types/templates/defaults';
import { logger, LogCategory } from '@/utils/logging';

export const useSessionParams = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const templateId = searchParams.get('template') || 'live-session';

  const {
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    matchingTemplate
  } = useMemo(() => {
    const isNewSession = !sessionId;
    // Only validate session if one is provided
    const isValidSessionId = sessionId ? /^[0-9a-fA-F-]+$/.test(sessionId) : true;
    
    const matchingTemplate = defaultTemplates.find(t => t.id === templateId);
    const isValidTemplateId = templateId ? (
      !!matchingTemplate || /^[0-9a-fA-F-]+$/.test(templateId)
    ) : false;

    return {
      isNewSession,
      isValidSessionId,
      isValidTemplateId,
      matchingTemplate
    };
  }, [sessionId, templateId]);

  const redirectToSession = (id: string, params?: { template?: string }) => {
    const targetTemplateId = params?.template || templateId;
    const currentSearchParams = new URLSearchParams(searchParams);
    const currentTemplate = currentSearchParams.get('template');
    
    if (id !== sessionId || targetTemplateId !== currentTemplate) {
      logger.info(LogCategory.ROUTING, 'useSessionParams', 'Redirecting to session', { 
        id, 
        params,
        currentTemplate: templateId,
        targetTemplate: targetTemplateId
      });
      
      const newSearchParams = new URLSearchParams();
      if (targetTemplateId && targetTemplateId !== 'live-session') {
        newSearchParams.set('template', targetTemplateId);
      }

      const queryString = newSearchParams.toString();
      const newPath = `/c/${id}${queryString ? `?${queryString}` : ''}`;
      navigate(newPath);
    }
  };

  const redirectToNew = (params?: { template?: string }) => {
    const targetTemplateId = params?.template || templateId;
    logger.info(LogCategory.ROUTING, 'useSessionParams', 'Redirecting to new session', {
      params,
      currentTemplate: templateId,
      targetTemplate: targetTemplateId
    });
    
    const newSearchParams = new URLSearchParams();
    if (targetTemplateId && targetTemplateId !== 'live-session') {
      newSearchParams.set('template', targetTemplateId);
    }

    const queryString = newSearchParams.toString();
    const newPath = `/${queryString ? `?${queryString}` : ''}`;
    navigate(newPath);
  };

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