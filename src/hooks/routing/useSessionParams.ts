import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

export const useSessionParams = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const templateId = searchParams.get('template');
  const patientId = searchParams.get('patient');

  // Improved validation logic
  const isNewSession = !sessionId;
  const isValidSessionId = sessionId && /^[0-9a-fA-F-]+$/.test(sessionId);
  const isValidTemplateId = templateId && /^[0-9a-fA-F-]+$/.test(templateId);
  const isValidPatientId = patientId && /^[0-9a-fA-F-]+$/.test(patientId);

  console.log('[useSessionParams] Current state:', {
    sessionId,
    templateId,
    patientId,
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    isValidPatientId,
    currentPath: window.location.pathname
  });

  const redirectToSession = (id: string, params?: { template?: string; patient?: string }) => {
    console.log('[useSessionParams] Redirecting to session:', { 
      id, 
      params,
      currentTemplate: templateId,
      currentPatient: patientId 
    });
    
    const newSearchParams = new URLSearchParams();
    
    // Preserve existing params if not explicitly changed
    if (!params?.template && templateId) {
      newSearchParams.set('template', templateId);
    } else if (params?.template) {
      newSearchParams.set('template', params.template);
    }
    
    if (!params?.patient && patientId) {
      newSearchParams.set('patient', patientId);
    } else if (params?.patient) {
      newSearchParams.set('patient', params.patient);
    }

    const queryString = newSearchParams.toString();
    const newPath = `/c/${id}${queryString ? `?${queryString}` : ''}`;
    
    console.log('[useSessionParams] New path:', newPath);
    navigate(newPath);
  };

  const redirectToNew = (params?: { template?: string; patient?: string }) => {
    console.log('[useSessionParams] Redirecting to new session with params:', {
      params,
      currentTemplate: templateId,
      currentPatient: patientId
    });
    
    const newSearchParams = new URLSearchParams();
    
    // Preserve existing params if not explicitly changed
    if (!params?.template && templateId) {
      newSearchParams.set('template', templateId);
    } else if (params?.template) {
      newSearchParams.set('template', params.template);
    }
    
    if (!params?.patient && patientId) {
      newSearchParams.set('patient', patientId);
    } else if (params?.patient) {
      newSearchParams.set('patient', params.patient);
    }

    const queryString = newSearchParams.toString();
    const newPath = `/${queryString ? `?${queryString}` : ''}`;
    
    console.log('[useSessionParams] New path:', newPath);
    navigate(newPath);
  };

  return {
    sessionId: isValidSessionId ? sessionId : null,
    templateId: isValidTemplateId ? templateId : null,
    patientId: isValidPatientId ? patientId : null,
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    isValidPatientId,
    redirectToNew,
    redirectToSession
  };
};