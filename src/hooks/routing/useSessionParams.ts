import { useParams, useNavigate, useSearchParams, useMemo } from 'react-router-dom';
import { defaultTemplates } from '@/types/templates/defaults';

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
    const isValidSessionId = sessionId ? /^[0-9a-fA-F-]+$/.test(sessionId) : false;
    
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
      console.log('[useSessionParams] Redirecting to session:', { 
        id, 
        params,
        currentTemplate: templateId,
        targetTemplate: targetTemplateId
      });
      
      const newSearchParams = new URLSearchParams();
      if (!params?.template && templateId) {
        newSearchParams.set('template', templateId);
      } else if (params?.template) {
        newSearchParams.set('template', params.template);
      }

      const queryString = newSearchParams.toString();
      const newPath = `/c/${id}${queryString ? `?${queryString}` : ''}`;
      navigate(newPath);
    }
  };

  const redirectToNew = (params?: { template?: string }) => {
    const targetTemplateId = params?.template || templateId;
    console.log('[useSessionParams] Redirecting to new session with params:', {
      params,
      currentTemplate: templateId,
      targetTemplate: targetTemplateId
    });
    
    const newSearchParams = new URLSearchParams();
    if (!params?.template && templateId) {
      newSearchParams.set('template', templateId);
    } else if (params?.template) {
      newSearchParams.set('template', params.template);
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