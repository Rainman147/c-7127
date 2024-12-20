import { supabase } from '@/integrations/supabase/client';

export const clearSession = async () => {
  try {
    await supabase.auth.signOut();
    console.log('Session cleared successfully');
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
};

export const checkSession = async () => {
  try {
    console.log('Checking session status...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      if (sessionError.message?.includes('refresh_token_not_found')) {
        console.log('Invalid refresh token, clearing session');
        await clearSession();
      }
      return { 
        session: null, 
        error: {
          message: sessionError.message,
          isRefreshTokenError: sessionError.message?.includes('refresh_token_not_found')
        }
      };
    }

    if (!session) {
      console.log('No active session found');
      return { session: null, error: null };
    }

    // Verify the session is still valid
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User verification failed:', userError);
      return { 
        session: null, 
        error: {
          message: userError.message,
          isRefreshTokenError: userError.message?.includes('refresh_token_not_found')
        }
      };
    }

    if (!user) {
      console.log('User not found, session invalid');
      await clearSession();
      return { 
        session: null, 
        error: {
          message: 'User session invalid',
          isRefreshTokenError: false
        }
      };
    }

    console.log('Session verified successfully');
    return { session, error: null };
  } catch (error: any) {
    console.error('Unexpected error checking session:', error);
    return { 
      session: null, 
      error: {
        message: error.message || 'Failed to verify session',
        isRefreshTokenError: false
      }
    };
  }
};