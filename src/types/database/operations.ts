
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export type TablesInsertGeneric<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdateGeneric<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

export type TablesRowGeneric<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type SingleQueryResult<T> = PostgrestSingleResponse<T>;
export type QueryResult<T> = PostgrestResponse<T>;

export type { Database };

