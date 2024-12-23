import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { defaultTemplates } from '@/types/templates/defaults';

export const useSessionParams = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const templateId = searchParams.get('template');

  // Enhanced validation logic
  const isNewSession = !sessionId;
  const isValidSessionId = sessionId ? /^[0-9a-fA-F-]+$/.test(sessionId) : false;
  
  // Improved template validation to handle both default and custom templates
  const isValidTemplateId = templateId ? (
    // Check if it's a default template
    defaultTemplates.some(template => template.id === templateId) ||
    // Or if it's a custom template (UUID format)
    /^[0-9a-fA-F-]+$/.test(templateId)
  ) : false;

  console.log('[useSessionParams] Current state:', {
    sessionId,
    templateId,
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    currentPath: window.location.pathname,
    defaultTemplatesCount: defaultTemplates.length,
    isDefaultTemplate: templateId ? defaultTemplates.some(t => t.id === templateId) : false
  });

  const redirectToSession = (id: string, params?: { template?: string }) => {
    console.log('[useSessionParams] Redirecting to session:', { 
      id, 
      params,
      currentTemplate: templateId,
      isValidTemplate: params?.template ? (
        defaultTemplates.some(t => t.id === params.template) ||
        /^[0-9a-fA-F-]+$/.test(params.template)
      ) : false
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
      currentTemplate: templateId,
      isValidTemplate: params?.template ? (
        defaultTemplates.some(t => t.id === params.template) ||
        /^[0-9a-fA-F-]+$/.test(params.template)
      ) : false
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