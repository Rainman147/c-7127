
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthError, Session } from '@supabase/supabase-js';

type AuthChangeEvent = 
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'MFA_CHALLENGE_VERIFIED';

export const useSessionManagement = () => {
  const [session, setSession] = useState<Session | null>(null);
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
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession) => {
      console.log('[useSessionManagement] Auth state changed:', event);
      console.log('[useSessionManagement] New session state:', newSession ? 'Active' : 'None');
      
      if (mounted) {
        switch (event) {
          case 'SIGNED_OUT':
            setSession(null);
            console.log('[useSessionManagement] Session cleared on sign out');
            toast({
              title: "Signed out",
              description: "You have been signed out successfully.",
            });
            break;
          case 'SIGNED_IN':
            if (newSession) {
              setSession(newSession);
              toast({
                title: "Welcome back!",
                description: "You have successfully signed in.",
              });
            }
            break;
          case 'TOKEN_REFRESHED':
            if (newSession) {
              console.log('[useSessionManagement] Session token refreshed');
              setSession(newSession);
            }
            break;
          case 'USER_UPDATED':
            if (newSession) {
              console.log('[useSessionManagement] User data updated');
              setSession(newSession);
            }
            break;
          case 'INITIAL_SESSION':
            // Handle initial session load - no toast needed
            if (newSession) {
              setSession(newSession);
            }
            break;
          default:
            // Handle any other cases
            if (!newSession && event !== 'SIGNED_OUT') {
              console.log('[useSessionManagement] Session expired or invalid');
              setSession(null);
              toast({
                title: "Session Expired",
                description: "Your session has expired. Please sign in again.",
                variant: "destructive",
              });
            }
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
