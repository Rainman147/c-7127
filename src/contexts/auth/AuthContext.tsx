
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthState, AuthContextType } from './types';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  status: 'INITIALIZING',
  session: null,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[Auth] Context initialization started');
    let ignoreUpdates = false;
    
    // Initial session check with improved error handling
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Performing initial session check');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session check error:', error);
          if (error.message.includes('Invalid Refresh Token')) {
            console.log('[Auth] Invalid refresh token detected, clearing session');
            await supabase.auth.signOut();
            navigate('/auth');
          }
          if (!ignoreUpdates) {
            setState({ 
              status: 'UNAUTHENTICATED',
              session: null,
            });
          }
          return;
        }

        console.log('[Auth] Initial session check result:', session ? 'Found' : 'Not found');
        if (!ignoreUpdates) {
          setState({ 
            status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
            session,
          });
        }
      } catch (error) {
        console.error('[Auth] Unexpected error during session check:', error);
        if (!ignoreUpdates) {
          setState({ 
            status: 'UNAUTHENTICATED',
            session: null,
          });
        }
      }
    };

    initializeAuth();

    // Enhanced auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change detected:', { event, hasSession: !!session });
      
      if (ignoreUpdates) return;
      
      switch (event) {
        case 'TOKEN_REFRESHED':
          console.log('[Auth] Token refreshed successfully');
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
          navigate('/auth');
          break;
          
        case 'SIGNED_IN':
          console.log('[Auth] User signed in');
          setState({ 
            status: 'AUTHENTICATED',
            session,
          });
          break;
          
        case 'USER_UPDATED':
          console.log('[Auth] User updated');
          setState(prev => ({
            ...prev,
            session,
          }));
          break;
          
        case 'INITIAL_SESSION':
          console.log('[Auth] Initial session:', { hasSession: !!session });
          setState({
            status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
            session,
          });
          if (!session) {
            navigate('/auth');
          }
          break;
          
        default:
          console.log('[Auth] Unhandled auth event:', event);
      }
    });

    // Cleanup function with state updates prevention
    return () => {
      console.log('[Auth] Cleanup: unsubscribing from auth changes');
      ignoreUpdates = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      navigate('/auth');
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
