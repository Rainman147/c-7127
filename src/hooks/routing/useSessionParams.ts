import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

export const useSessionParams = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const templateId = searchParams.get('template');

  // Improved validation logic
  const isNewSession = !sessionId;
  const isValidSessionId = sessionId && /^[0-9a-fA-F-]+$/.test(sessionId);
  const isValidTemplateId = templateId && /^[0-9a-fA-F-]+$/.test(templateId);

  console.log('[useSessionParams] Current state:', {
    sessionId,
    templateId,
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    currentPath: window.location.pathname
  });

  const redirectToSession = (id: string, params?: { template?: string }) => {
    console.log('[useSessionParams] Redirecting to session:', { 
      id, 
      params,
      currentTemplate: templateId 
    });
    
    const newSearchParams = new URLSearchParams();
    
    // Preserve template param if not explicitly changed
    if (!params?.template && templateId) {
      newSearchParams.set('template', templateId);
    } else if (params?.template) {
      newSearchParams.set('template', params.template);
    }

    const queryString = newSearchParams.toString();
    const newPath = `/c/${id}${queryString ? `?${queryString}` : ''}`;
    
    console.log('[useSessionParams] New path:', newPath);
    navigate(newPath);
  };

  const redirectToNew = (params?: { template?: string }) => {
    console.log('[useSessionParams] Redirecting to new session with params:', {
      params,
      currentTemplate: templateId
    });
    
    const newSearchParams = new URLSearchParams();
    
    // Preserve template param if not explicitly changed
    if (!params?.template && templateId) {
      newSearchParams.set('template', templateId);
    } else if (params?.template) {
      newSearchParams.set('template', params.template);
    }

    const queryString = newSearchParams.toString();
    const newPath = `/${queryString ? `?${queryString}` : ''}`;
    
    console.log('[useSessionParams] New path:', newPath);
    navigate(newPath);
  };

  return {
    sessionId: isValidSessionId ? sessionId : null,
    templateId: isValidTemplateId ? templateId : null,
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    redirectToNew,
    redirectToSession
  };
};