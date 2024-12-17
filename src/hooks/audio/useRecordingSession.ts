import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useRecordingSession = () => {
  const sessionIdRef = useRef<string>('');

  const createSession = useCallback(() => {
    const sessionId = uuidv4();
    sessionIdRef.current = sessionId;
    console.log('Starting new recording session:', sessionId);
    return sessionId;
  }, []);

  const clearSession = useCallback(() => {
    console.log('Clearing recording session:', sessionIdRef.current);
    sessionIdRef.current = '';
  }, []);

  const getSessionId = useCallback(() => {
    return sessionIdRef.current;
  }, []);

  return {
    createSession,
    clearSession,
    getSessionId
  };
};