import { supabase } from '@/integrations/supabase/client';

export const clearSession = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error clearing session:', error);
      throw error;
    }
    console.log('Session cleared successfully');
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
};

export const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      await clearSession();
      throw error;
    }

    if (!session) {
      console.log('No active session found');
      return { session: null, error: null };
    }

    return { session, error: null };
  } catch (error: any) {
    console.error('Auth error:', error);
    return { 
      session: null, 
      error: {
        message: error.message,
        isRefreshTokenError: error.message?.includes('refresh_token_not_found')
      }
    };
  }
};