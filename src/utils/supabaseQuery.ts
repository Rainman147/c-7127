import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Define valid table names
export type TableName = 
  | 'users'
  | 'patients'
  | 'messages'
  | 'chats'
  | 'audio_chunks'
  | 'doctors'
  | 'edited_messages'
  | 'ehr_exports'
  | 'feedback'
  | 'file_upload_sessions'
  | 'templates';

export interface QueryOptions {
  filters?: Record<string, any>;
  ordering?: {
    column: string;
    ascending?: boolean;
  };
  pagination?: {
    from: number;
    to: number;
  };
  signal?: AbortSignal;
}

export interface QueryResult<T> {
  data: T[] | null;
  error: PostgrestError | Error | null;
  count: number | null;
}

export async function runSupabaseQuery<T>(
  tableName: TableName,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const { filters, ordering, pagination, signal } = options;

  try {
    console.log(`[supabaseQuery] Starting query for table: ${tableName}`, { 
      filters, 
      ordering, 
      pagination 
    });

    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' });

    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering if provided
    if (ordering) {
      query = query.order(ordering.column, { 
        ascending: ordering.ascending ?? false 
      });
    }

    // Apply pagination if provided
    if (pagination) {
      query = query.range(pagination.from, pagination.to);
    }

    // Apply abort signal if provided
    if (signal) {
      query = query.abortSignal(signal);
    }

    console.log(`[supabaseQuery] Executing query for ${tableName}`);
    const { data, error, count } = await query;

    if (error) {
      console.error(`[supabaseQuery] Error querying ${tableName}:`, error);
      return { data: null, error, count: null };
    }

    console.log(`[supabaseQuery] Successfully fetched ${data?.length} records from ${tableName}`);
    return { data: data as T[], error: null, count };

  } catch (error) {
    console.error(`[supabaseQuery] Unexpected error querying ${tableName}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred'), 
      count: null 
    };
  }
}

// Helper function for single record queries
export async function runSupabaseSingleQuery<T>(
  tableName: TableName,
  options: QueryOptions = {}
): Promise<{ data: T | null; error: PostgrestError | Error | null }> {
  try {
    console.log(`[supabaseQuery] Starting single record query for table: ${tableName}`);
    const result = await runSupabaseQuery<T>(tableName, options);
    
    return {
      data: result.data?.[0] || null,
      error: result.error
    };
  } catch (error) {
    console.error(`[supabaseQuery] Error in single record query for ${tableName}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
}

// Type guard for PostgrestError
export function isPostgrestError(error: any): error is PostgrestError {
  return error && typeof error === 'object' && 'code' in error && 'message' in error;
}