import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

export const useSessionParams = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const templateId = searchParams.get('template');
  const patientId = searchParams.get('patient');

  // Improved validation logic
  const isNewSession = sessionId === 'new';
  const isValidSessionId = sessionId && !isNewSession && /^[0-9a-fA-F-]+$/.test(sessionId);
  const isValidTemplateId = templateId && /^[0-9a-fA-F-]+$/.test(templateId);
  const isValidPatientId = patientId && /^[0-9a-fA-F-]+$/.test(patientId);

  console.log('[useSessionParams] Current params:', {
    sessionId,
    templateId,
    patientId,
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    isValidPatientId
  });

  const redirectToSession = (id: string, params?: { template?: string; patient?: string }) => {
    console.log('[useSessionParams] Redirecting to session:', { id, params });
    const newSearchParams = new URLSearchParams();
    
    if (params?.template) {
      newSearchParams.set('template', params.template);
    }
    if (params?.patient) {
      newSearchParams.set('patient', params.patient);
    }

    // Preserve existing params if not explicitly changed
    if (!params?.template && templateId) {
      newSearchParams.set('template', templateId);
    }
    if (!params?.patient && patientId) {
      newSearchParams.set('patient', patientId);
    }

    const queryString = newSearchParams.toString();
    navigate(`/c/${id}${queryString ? `?${queryString}` : ''}`);
  };

  const redirectToNew = (params?: { template?: string; patient?: string }) => {
    console.log('[useSessionParams] Redirecting to new session with params:', params);
    const newSearchParams = new URLSearchParams();
    
    if (params?.template) {
      newSearchParams.set('template', params.template);
    }
    if (params?.patient) {
      newSearchParams.set('patient', params.patient);
    }

    // Preserve existing params if not explicitly changed
    if (!params?.template && templateId) {
      newSearchParams.set('template', templateId);
    }
    if (!params?.patient && patientId) {
      newSearchParams.set('patient', patientId);
    }

    const queryString = newSearchParams.toString();
    navigate(`/c/new${queryString ? `?${queryString}` : ''}`);
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