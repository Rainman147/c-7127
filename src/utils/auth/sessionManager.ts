import { supabase } from '@/integrations/supabase/client';

export const clearSession = async () => {
  try {
    console.log('Clearing session...');
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
      if (sessionError.message?.includes('session_not_found') || 
          sessionError.message?.includes('JWT expired')) {
        console.log('Invalid or expired session, clearing local state');
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

    // Verify session is still valid
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('User verification failed:', userError);
        if (userError.message?.includes('session_not_found')) {
          await clearSession();
        }
        return { 
          session: null, 
          error: {
            message: userError.message,
            isRefreshTokenError: false
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
      console.error('User verification failed:', error);
      return { 
        session: null, 
        error: {
          message: error.message || 'Failed to verify session',
          isRefreshTokenError: false
        }
      };
    }
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