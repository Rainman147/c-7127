import { supabase } from '@/integrations/supabase/client';

export const clearSession = async () => {
  try {
    console.log('[SessionManager] Starting session cleanup');
    
    // First check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[SessionManager] Error checking session:', sessionError);
      // Even if there's an error checking the session, we should still clear local storage
      localStorage.removeItem('supabase.auth.token');
      return;
    }

    if (!session) {
      console.log('[SessionManager] No active session found, skipping logout');
      localStorage.removeItem('supabase.auth.token');
      return;
    }

    // Only attempt to sign out if we have a valid session
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[SessionManager] Error during sign out:', error);
      // If we get a session_not_found error, we can ignore it
      if (error.message?.includes('session_not_found')) {
        console.log('[SessionManager] Session already cleared');
        localStorage.removeItem('supabase.auth.token');
        return;
      }
      throw error;
    }
    
    console.log('[SessionManager] Session cleared successfully');
  } catch (error) {
    console.error('[SessionManager] Error clearing session:', error);
    // Even if there's an error, we want to make sure the local storage is cleared
    localStorage.removeItem('supabase.auth.token');
  }
};

export const checkSession = async () => {
  try {
    console.log('[SessionManager] Checking session status');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[SessionManager] Session error:', error);
      if (error.message?.includes('refresh_token_not_found')) {
        console.log('[SessionManager] Invalid refresh token, clearing session');
        await clearSession();
      }
      throw error;
    }

    if (!session) {
      console.log('[SessionManager] No active session found');
      return { session: null, error: null };
    }

    return { session, error: null };
  } catch (error: any) {
    console.error('[SessionManager] Auth error:', error);
    return { 
      session: null, 
      error: {
        message: error.message || 'Authentication error occurred',
        isRefreshTokenError: error.message?.includes('refresh_token_not_found')
      }
    };
  }
};