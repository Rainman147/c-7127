import { useParams, useNavigate } from 'react-router-dom';

export const useSessionParams = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const isNewSession = sessionId === 'new';
  const isValidSessionId = sessionId && !isNewSession && /^[0-9a-fA-F-]+$/.test(sessionId);

  console.log('[useSessionParams] Current session params:', {
    sessionId,
    isNewSession,
    isValidSessionId
  });

  const redirectToNew = () => {
    console.log('[useSessionParams] Redirecting to new session');
    navigate('/c/new');
  };

  const redirectToSession = (id: string) => {
    console.log('[useSessionParams] Redirecting to session:', id);
    navigate(`/c/${id}`);
  };

  return {
    sessionId: isValidSessionId ? sessionId : null,
    isNewSession,
    isValidSessionId,
    redirectToNew,
    redirectToSession
  };
};