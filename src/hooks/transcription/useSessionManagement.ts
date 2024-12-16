import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSessionManagement = () => {
  const [recordingSessionId, setRecordingSessionId] = useState<string>('');
  const { toast } = useToast();

  const createSession = useCallback(() => {
    const newSessionId = crypto.randomUUID();
    setRecordingSessionId(newSessionId);
    return newSessionId;
  }, []);

  const clearSession = useCallback(() => {
    setRecordingSessionId('');
  }, []);

  const handleSessionError = useCallback((error: Error) => {
    console.error('Session error:', error);
    toast({
      title: "Session Error",
      description: error.message,
      variant: "destructive"
    });
  }, [toast]);

  return {
    recordingSessionId,
    createSession,
    clearSession,
    handleSessionError
  };
};