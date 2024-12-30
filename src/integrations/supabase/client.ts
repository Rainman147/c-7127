import { createClient } from '@supabase/supabase-js';

// Default values for local development
const FALLBACK_URL = 'https://hlnzunnahksudbotqvpk.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsbnp1bm5haGtzdWRib3RxdnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMzUwMDMsImV4cCI6MjA0OTcxMTAwM30.eyhZr2I4T13hPbzW1NKummiDRcWHWr1gRhE4v9P2EWE';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL).replace(/:+$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Supabase URL is required. Please check your environment variables.');
}

if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key is required. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});