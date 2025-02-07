
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthState, AuthContextType } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  status: 'INITIALIZING',
  session: null,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    console.log('[Auth] Context initialization started');
    
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session check:', session ? 'Found' : 'Not found');
      setState({ 
        status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
        session,
      });
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] State change detected:', { event, hasSession: !!session });
      setState({ 
        status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
        session,
      });
    });

    return () => {
      console.log('[Auth] Cleanup: unsubscribing from auth changes');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('[Auth] Sign out requested');
    await supabase.auth.signOut();
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
