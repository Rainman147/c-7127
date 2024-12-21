import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

export const useSessionParams = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const templateId = searchParams.get('template');
  const patientId = searchParams.get('patient');

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
    const searchParams = new URLSearchParams();
    
    if (params?.template) {
      searchParams.set('template', params.template);
    }
    if (params?.patient) {
      searchParams.set('patient', params.patient);
    }

    const queryString = searchParams.toString();
    navigate(`/c/${id}${queryString ? `?${queryString}` : ''}`);
  };

  const redirectToNew = (params?: { template?: string; patient?: string }) => {
    console.log('[useSessionParams] Redirecting to new session with params:', params);
    const searchParams = new URLSearchParams();
    
    if (params?.template) {
      searchParams.set('template', params.template);
    }
    if (params?.patient) {
      searchParams.set('patient', params.patient);
    }

    const queryString = searchParams.toString();
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