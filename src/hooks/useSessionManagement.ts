
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSessionManagement = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    console.log('[useSessionManagement] Initializing session management');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[useSessionManagement] Error getting session:', error);
        return;
      }
      console.log('[useSessionManagement] Initial session:', session ? 'Active' : 'None');
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[useSessionManagement] Auth state changed:', _event);
      console.log('[useSessionManagement] New session state:', session ? 'Active' : 'None');
      setSession(session);
    });

    return () => {
      console.log('[useSessionManagement] Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  return { session };
};
