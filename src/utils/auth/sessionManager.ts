import { supabase } from '@/integrations/supabase/client';

export const clearSession = async () => {
  try {
    await supabase.auth.signOut();
    console.log('Session cleared successfully');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      if (error.message?.includes('refresh_token_not_found')) {
        console.log('Invalid refresh token, clearing session');
        await clearSession();
        return { 
          session: null, 
          error: {
            message: 'Your session has expired. Please sign in again.',
            isRefreshTokenError: true
          }
        };
      }
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
        message: error.message || 'Authentication error occurred',
        isRefreshTokenError: error.message?.includes('refresh_token_not_found')
      }
    };
  }
};