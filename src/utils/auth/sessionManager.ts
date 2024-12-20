import { supabase } from '@/integrations/supabase/client';

export const clearSession = async () => {
  try {
    // First check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error checking session:', sessionError);
      return;
    }

    if (!session) {
      console.log('No active session found, skipping logout');
      return;
    }

    // Only attempt to sign out if we have a valid session
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during sign out:', error);
      // If we get a session_not_found error, we can ignore it
      if (error.message?.includes('session_not_found')) {
        console.log('Session already cleared');
        return;
      }
      throw error;
    }
    
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