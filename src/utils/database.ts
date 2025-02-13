
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { TablesInsertGeneric, TablesUpdateGeneric, TablesRowGeneric } from '@/types/database/operations';

export async function insertRow<T extends keyof Database['public']['Tables']>(
  table: T,
  data: TablesInsertGeneric<T>
) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result as TablesRowGeneric<T>;
}

export async function updateRow<T extends keyof Database['public']['Tables']>(
  table: T,
  id: string,
  data: TablesUpdateGeneric<T>
) {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result as TablesRowGeneric<T>;
}

export async function deleteRow<T extends keyof Database['public']['Tables']>(
  table: T,
  id: string
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getRow<T extends keyof Database['public']['Tables']>(
  table: T,
  id: string
) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as TablesRowGeneric<T>;
}

export async function getRows<T extends keyof Database['public']['Tables']>(
  table: T,
  query?: {
    column: string;
    value: string | number | boolean;
  }
) {
  let dbQuery = supabase.from(table).select('*');
  
  if (query) {
    dbQuery = dbQuery.eq(query.column, query.value);
  }

  const { data, error } = await dbQuery;

  if (error) throw error;
  return (data || []) as TablesRowGeneric<T>[];
}

