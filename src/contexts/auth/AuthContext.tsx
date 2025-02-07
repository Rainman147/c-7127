
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  const mountedRef = useRef(false);
  const sessionCheckInProgressRef = useRef(false);

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleAuthError = useCallback((error: Error, recoverable = true) => {
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
  }, [toast, updateState]);

  const checkSession = useCallback(async () => {
    if (sessionCheckInProgressRef.current) {
      console.log('[AuthProvider] Session check already in progress, skipping');
      return;
    }

    try {
      sessionCheckInProgressRef.current = true;
      console.log('[AuthProvider] Checking session');
      updateState({ status: 'CHECKING_SESSION' });
      
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (mountedRef.current) {
        console.log('[AuthProvider] Session check complete:', session ? 'Found session' : 'No session');
        updateState({ 
          session, 
          status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
          error: null 
        });
      }
    } catch (error) {
      console.error('[AuthProvider] Error checking session:', error);
      if (mountedRef.current) {
        handleAuthError(error as Error);
      }
    } finally {
      sessionCheckInProgressRef.current = false;
    }
  }, [handleAuthError, updateState]);

  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    console.log('[AuthProvider] Auth state changed:', event, session);
    
    if (!mountedRef.current) {
      console.log('[AuthProvider] Component unmounted, ignoring auth state change');
      return;
    }

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
        // Only update if we're in INITIALIZING or CHECKING_SESSION state
        if (state.status === 'INITIALIZING' || state.status === 'CHECKING_SESSION') {
          updateState({
            session,
            status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
            error: null
          });
        }
        break;
    }
  }, [state.status, toast, updateState]);

  useEffect(() => {
    console.log('[AuthProvider] Component mounted');
    mountedRef.current = true;

    // Initialize session
    checkSession();

    // Set up auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log('[AuthProvider] Component unmounting');
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [checkSession, handleAuthStateChange]);

  const signOut = useCallback(async () => {
    try {
      console.log('[AuthProvider] Initiating sign out');
      
      // Update local state first to prevent UI flicker
      updateState({ 
        status: 'UNAUTHENTICATED',
        session: null,
        error: null
      });

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthProvider] Sign out error:', error);
        toast({
          title: "Warning",
          description: "There was an issue completing the sign out process. Please try again.",
          variant: "destructive",
        });
        // Force a session check to ensure our state is correct
        await checkSession();
        return;
      }

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
      // Force a session check to ensure our state is correct
      await checkSession();
    }
  }, [checkSession, toast, updateState]);

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
