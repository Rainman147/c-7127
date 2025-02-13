
import { PostgrestError } from '@supabase/supabase-js';

export type QueryResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

export const handleQueryResult = <T>(result: QueryResult<T>) => {
  if (result.error) {
    throw result.error;
  }
  return result.data;
};

export const handleSingleResult = <T>(result: QueryResult<T>): T => {
  const data = handleQueryResult(result);
  if (!data) {
    throw new Error('No data found');
  }
  return data;
};

export const handleMaybeSingleResult = <T>(result: QueryResult<T>): T | null => {
  const data = handleQueryResult(result);
  return data || null;
};

export const handleArrayResult = <T>(result: QueryResult<T[]>): T[] => {
  const data = handleQueryResult(result);
  return data || [];
};

