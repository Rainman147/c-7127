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
      await clearSession();
      throw error;
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