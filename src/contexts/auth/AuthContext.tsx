
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
    
    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session check error:', error);
          if (error.message.includes('Invalid Refresh Token')) {
            console.log('[Auth] Invalid refresh token, redirecting to login');
            await supabase.auth.signOut();
            navigate('/auth');
          }
          setState({ 
            status: 'UNAUTHENTICATED',
            session: null,
          });
          return;
        }

        console.log('[Auth] Initial session check:', session ? 'Found' : 'Not found');
        setState({ 
          status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
          session,
        });
      } catch (error) {
        console.error('[Auth] Unexpected error during session check:', error);
        setState({ 
          status: 'UNAUTHENTICATED',
          session: null,
        });
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change detected:', { event, hasSession: !!session });
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refreshed successfully');
        setState({ 
          status: 'AUTHENTICATED',
          session,
        });
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out');
        setState({ 
          status: 'UNAUTHENTICATED',
          session: null,
        });
        navigate('/auth');
      } else if (event === 'SIGNED_IN') {
        console.log('[Auth] User signed in');
        setState({ 
          status: 'AUTHENTICATED',
          session,
        });
      } else if (event === 'USER_UPDATED') {
        console.log('[Auth] User updated');
        setState(prev => ({
          ...prev,
          session,
        }));
      } else if (event === 'INITIAL_SESSION') {
        console.log('[Auth] Initial session:', { hasSession: !!session });
        setState({
          status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
          session,
        });
        if (!session) {
          navigate('/auth');
        }
      }
    });

    return () => {
      console.log('[Auth] Cleanup: unsubscribing from auth changes');
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
