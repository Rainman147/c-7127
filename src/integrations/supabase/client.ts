import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { logger, LogCategory } from '@/utils/logging';

const SUPABASE_URL = "https://hlnzunnahksudbotqvpk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsbnp1bm5haGtzdWRib3RxdnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMzUwMDMsImV4cCI6MjA0OTcxMTAwM30.eyhZr2I4T13hPbzW1NKummiDRcWHWr1gRhE4v9P2EWE";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  logger.error(LogCategory.DATABASE, 'SupabaseClient', 'Missing Supabase configuration');
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'lovable-chat'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add error logging middleware
supabase.realtime.setAuth = ((originalSetAuth) => {
  return async function (...args) {
    try {
      const result = await originalSetAuth.apply(this, args);
      logger.info(LogCategory.DATABASE, 'SupabaseClient', 'Auth token set successfully');
      return result;
    } catch (error) {
      logger.error(LogCategory.DATABASE, 'SupabaseClient', 'Failed to set auth token:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };
})(supabase.realtime.setAuth);