import { supabase } from '@/integrations/supabase/client';

export const clearSession = async () => {
  try {
    console.log('[SessionManager] Starting session cleanup');
    
    // Clear all local storage data
    localStorage.clear();
    console.log('[SessionManager] Cleared local storage');
    
    // Attempt a global signout to ensure server-side cleanup
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('[SessionManager] Server-side session cleared');
    } catch (error: any) {
      // Ignore session_not_found errors as we've already cleared local storage
      if (!error.message?.includes('session_not_found')) {
        console.error('[SessionManager] Error during server-side cleanup:', error);
      }
    }
    
    console.log('[SessionManager] Session cleanup completed');
  } catch (error) {
    console.error('[SessionManager] Critical error during session cleanup:', error);
    throw error;
  }
};

export const validateSession = async () => {
  try {
    console.log('[SessionManager] Validating session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[SessionManager] Session validation error:', sessionError);
      return false;
    }

    if (!session) {
      console.log('[SessionManager] No active session found');
      return false;
    }

    // Log session details for debugging
    console.log('[SessionManager] Current session:', {
      accessToken: session.access_token?.substring(0, 10) + '...',
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      user: session.user.id
    });

    // Check if token is close to expiry (within 5 minutes)
    const tokenExpiryTime = new Date(session.expires_at! * 1000);
    const now = new Date();
    const timeUntilExpiry = tokenExpiryTime.getTime() - now.getTime();
    
    if (timeUntilExpiry < 300000) { // 5 minutes in milliseconds
      console.log('[SessionManager] Token near expiry, attempting refresh');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error('[SessionManager] Token refresh failed:', refreshError);
        return false;
      }
      
      console.log('[SessionManager] Token refreshed successfully');
      // Log refreshed session details
      console.log('[SessionManager] Refreshed session:', {
        accessToken: refreshData.session.access_token?.substring(0, 10) + '...',
        expiresAt: new Date(refreshData.session.expires_at! * 1000).toISOString(),
        user: refreshData.session.user.id
      });
    }

    return true;
  } catch (error) {
    console.error('[SessionManager] Critical validation error:', error);
    return false;
  }
};