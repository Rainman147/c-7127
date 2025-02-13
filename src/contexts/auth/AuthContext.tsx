import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthState, AuthContextType } from './types';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  status: 'INITIALIZING',
  session: null,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[Auth] Context initialization started');
    
    let mounted = true;

    // Initial session check
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Checking initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session check error:', error);
          if (mounted) {
            setState({ 
              status: 'UNAUTHENTICATED',
              session: null,
            });
          }
          return;
        }

        console.log('[Auth] Initial session state:', session ? 'Found' : 'Not found');
        if (mounted) {
          setState({ 
            status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
            session,
          });
        }
      } catch (error) {
        console.error('[Auth] Unexpected error during session check:', error);
        if (mounted) {
          setState({ 
            status: 'UNAUTHENTICATED',
            session: null,
          });
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Subscribe to auth changes with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change detected:', { event, hasSession: !!session });
      
      try {
        switch (event) {
          case 'SIGNED_IN':
            console.log('[Auth] User signed in');
            setState({ 
              status: 'AUTHENTICATED',
              session,
            });
            break;

          case 'SIGNED_OUT':
            console.log('[Auth] User signed out');
            setState({ 
              status: 'UNAUTHENTICATED',
              session: null,
            });
            break;

          case 'TOKEN_REFRESHED':
            console.log('[Auth] Token refreshed successfully');
            setState(prev => ({ 
              ...prev,
              session,
            }));
            break;

          case 'USER_UPDATED':
            console.log('[Auth] User data updated');
            setState(prev => ({
              ...prev,
              session,
            }));
            break;

          case 'USER_DELETED':
            console.log('[Auth] User deleted');
            setState({ 
              status: 'UNAUTHENTICATED',
              session: null,
            });
            break;

          default:
            console.log('[Auth] Unhandled auth event:', event);
            // Keep current state for unhandled events
            break;
        }
      } catch (error) {
        console.error('[Auth] Error handling auth state change:', error);
        toast({
          title: "Authentication Error",
          description: "There was a problem with your session. Please try logging in again.",
          variant: "destructive",
        });
      }
    });

    return () => {
      console.log('[Auth] Cleanup: unsubscribing from auth changes');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    console.log('[Auth] Sign out requested');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Sign out error:', error);
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    } catch (error) {
      console.error('[Auth] Unexpected error during sign out:', error);
      // Force the state to unauthenticated even if the signOut call failed
      setState({ 
        status: 'UNAUTHENTICATED',
        session: null,
      });
      toast({
        title: "Error",
        description: "Failed to sign out properly. Please try again.",
        variant: "destructive",
      });
    }
  };

  console.log('[Auth] Current state:', state);

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
