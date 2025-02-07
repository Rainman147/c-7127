
import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AuthState, AuthStatus, AuthError } from '@/types/auth';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  status: 'INITIALIZING',
  session: null,
  error: null,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const { toast } = useToast();

  const updateState = (updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleAuthError = (error: Error, recoverable = true) => {
    console.error('[AuthProvider] Auth error:', error);
    
    const authError: AuthError = {
      code: 'AUTH_ERROR',
      message: error.message,
      recoverable,
    };

    updateState({ 
      status: 'ERROR',
      error: authError
    });

    toast({
      title: "Authentication Error",
      description: error.message,
      variant: "destructive",
    });
  };

  useEffect(() => {
    let mounted = true;
    console.log('[AuthProvider] Initializing');

    const initSession = async () => {
      try {
        updateState({ status: 'CHECKING_SESSION' });
        
        // Get the session and store it
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          console.log('[AuthProvider] Session check complete:', session ? 'Found session' : 'No session');
          updateState({ 
            session, 
            status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
            error: null 
          });
        }
      } catch (error) {
        console.error('[AuthProvider] Error initializing session:', error);
        if (mounted) {
          handleAuthError(error as Error);
        }
      }
    };

    // Initialize session
    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, session);
      
      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
          updateState({ 
            session,
            status: 'AUTHENTICATED',
            error: null
          });
          toast({
            title: "Signed in successfully",
            description: "Welcome back!"
          });
          break;

        case 'SIGNED_OUT':
          updateState({ 
            session: null,
            status: 'UNAUTHENTICATED',
            error: null
          });
          toast({
            title: "Signed out",
            description: "You have been signed out successfully"
          });
          break;

        case 'TOKEN_REFRESHED':
          updateState({ 
            session,
            status: 'AUTHENTICATED',
            error: null
          });
          break;

        case 'USER_UPDATED':
          updateState({ 
            session,
            error: null
          });
          toast({
            title: "Profile updated",
            description: "Your profile has been updated successfully"
          });
          break;

        case 'INITIAL_SESSION':
          // Only update if we don't already have a session to prevent overwriting
          if (!state.session) {
            updateState({
              session,
              status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
              error: null
            });
          }
          break;
      }
    });

    return () => {
      console.log('[AuthProvider] Cleaning up');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast, state.session]);

  const signOut = async () => {
    try {
      console.log('[AuthProvider] Signing out');
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session exists, just update local state
      if (!session) {
        console.log('[AuthProvider] No active session found, updating local state only');
        updateState({ 
          status: 'UNAUTHENTICATED',
          session: null,
          error: null
        });
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
        return;
      }

      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthProvider] Sign out error:', error);
        toast({
          title: "Warning",
          description: "There was an issue completing the sign out process. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Then update local state
      updateState({ 
        status: 'UNAUTHENTICATED',
        session: null,
        error: null
      });

      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error) {
      console.error('[AuthProvider] Sign out error:', error);
      toast({
        title: "Error",
        description: "There was an issue signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

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
