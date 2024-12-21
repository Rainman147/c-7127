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
    // First check if we have a session in memory
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      if (sessionError.message?.includes('refresh_token_not_found')) {
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
      throw sessionError;
    }

    if (!session) {
      console.log('No active session found');
      return { session: null, error: null };
    }

    // Verify the session is still valid
    const { error: verifyError } = await supabase.auth.getUser();
    if (verifyError) {
      console.error('User verification failed:', verifyError);
      await clearSession();
      return {
        session: null,
        error: {
          message: 'Session verification failed. Please sign in again.',
          isRefreshTokenError: false
        }
      };
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