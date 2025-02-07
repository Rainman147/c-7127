
import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    session: null,
    isLoading: true,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    console.log('[AuthProvider] Initializing');
    
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setState(prev => ({ ...prev, session, isLoading: false }));
      } catch (error) {
        console.error('[AuthProvider] Session init error:', error);
        setState(prev => ({ ...prev, error: error as Error, isLoading: false }));
      }
    };

    // Initialize session
    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthProvider] Auth state changed:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          setState(prev => ({ ...prev, session }));
          toast({
            title: "Signed in successfully",
            description: "Welcome back!"
          });
          break;
        case 'SIGNED_OUT':
          setState(prev => ({ ...prev, session: null }));
          toast({
            title: "Signed out",
            description: "You have been signed out successfully"
          });
          break;
        case 'TOKEN_REFRESHED':
          setState(prev => ({ ...prev, session }));
          break;
      }
    });

    return () => {
      console.log('[AuthProvider] Cleaning up');
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    try {
      console.log('[AuthProvider] Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('[AuthProvider] Sign out error:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, error: error as Error }));
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
