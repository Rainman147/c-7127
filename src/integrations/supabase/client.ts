
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hlnzunnahksudbotqvpk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsbnp1bm5haGtzdWRib3RxdnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMzUwMDMsImV4cCI6MjA0OTcxMTAwM30.eyhZr2I4T13hPbzW1NKummiDRcWHWr1gRhE4v9P2EWE";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      debug: true // Temporarily enable for debugging
    }
  }
);
