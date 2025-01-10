import { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type SessionValidationStatus = 'validating' | 'validated' | 'error';

interface SessionContextType {
  status: SessionValidationStatus;
  session: Session | null;
  error: Error | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<SessionValidationStatus>('validating');
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('[SessionProvider] Initializing session provider');
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[SessionProvider] Auth state changed:', _event);
      if (session) {
        setSession(session);
        setStatus('validated');
        setError(null);
      } else {
        setSession(null);
        setStatus('error');
        setError(new Error('No session found'));
      }
    });

    return () => {
      console.log('[SessionProvider] Cleaning up session subscription');
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ status, session, error }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};