
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSessionManagement = () => {
  const [session, setSession] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[useSessionManagement] Initializing session management');
    let mounted = true;
    
    const initializeSession = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[useSessionManagement] Error getting session:', error);
          toast({
            title: "Authentication Error",
            description: "There was a problem loading your session. Please try logging in again.",
            variant: "destructive",
          });
          return;
        }

        if (mounted) {
          console.log('[useSessionManagement] Initial session:', initialSession ? 'Active' : 'None');
          setSession(initialSession);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('[useSessionManagement] Unexpected error:', error);
      }
    };

    // Initialize session
    initializeSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('[useSessionManagement] Auth state changed:', _event);
      console.log('[useSessionManagement] New session state:', newSession ? 'Active' : 'None');
      
      if (mounted) {
        // If we get a session_not_found error during signOut, clear the session anyway
        if (_event === 'SIGNED_OUT' || _event === 'TOKEN_REFRESHED' || !newSession) {
          setSession(null);
        } else {
          setSession(newSession);
        }
        
        // Show relevant toast messages
        if (_event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
        } else if (_event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
        }
      }
    });

    return () => {
      console.log('[useSessionManagement] Cleaning up subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  return { session, isInitialized };
};
