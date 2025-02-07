
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
    console.log('[AuthProvider] Initializing');
    
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthProvider] Initial session:', session ? 'Found' : 'None');
      setState({ 
        status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
        session,
      });
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthProvider] Auth state changed:', event);
      setState({ 
        status: session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
        session,
      });
    });

    return () => {
      console.log('[AuthProvider] Cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
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
