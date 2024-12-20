import { supabase } from '@/integrations/supabase/client';

export const clearSession = async () => {
  try {
    console.log('[SessionManager] Starting session cleanup');
    
    // Always clear local storage first to prevent further invalid token usage
    localStorage.removeItem('supabase.auth.token');
    console.log('[SessionManager] Cleared local storage token');

    // Attempt to get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[SessionManager] Error checking session:', sessionError);
      return;
    }

    if (!session) {
      console.log('[SessionManager] No active session found, skipping server logout');
      return;
    }

    // Only attempt to sign out if we had a valid session
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error('[SessionManager] Error during sign out:', error);
      // If we get a session_not_found error, we can ignore it since we've already cleared local storage
      if (error.message?.includes('session_not_found')) {
        console.log('[SessionManager] Session already cleared on server');
        return;
      }
      throw error;
    }
    
    console.log('[SessionManager] Session cleared successfully');
  } catch (error) {
    console.error('[SessionManager] Critical error during session cleanup:', error);
    // Even if there's an error, we've already cleared local storage
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

    // Check if token is close to expiry (within 5 minutes)
    const tokenExpiryTime = new Date(session.expires_at! * 1000);
    const now = new Date();
    const timeUntilExpiry = tokenExpiryTime.getTime() - now.getTime();
    
    if (timeUntilExpiry < 300000) { // 5 minutes in milliseconds
      console.log('[SessionManager] Token near expiry, attempting refresh');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('[SessionManager] Token refresh failed:', refreshError);
        return false;
      }
      
      if (!refreshData.session) {
        console.log('[SessionManager] No session after refresh');
        return false;
      }
      
      console.log('[SessionManager] Token refreshed successfully');
    }

    return true;
  } catch (error) {
    console.error('[SessionManager] Critical validation error:', error);
    return false;
  }
};