import { Json } from '@/integrations/supabase/types';
import { parseSupabaseJson } from './utils';

export type Template = {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
  // Database fields (optional since hardcoded templates won't have these)
  content?: string;
  instructions?: Record<string, any> | null;
  schema?: Record<string, any> | null;
  priority_rules?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

// Helper type for database templates
export type DbTemplate = {
  id: string;
  name: string;
  description: string;
  system_instructions: string;
  content: string;
  instructions: Json;
  schema: Json;
  priority_rules: Json;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export const convertDbTemplate = (dbTemplate: DbTemplate): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  description: dbTemplate.description,
  systemInstructions: dbTemplate.system_instructions,
  content: dbTemplate.content,
  instructions: parseSupabaseJson(dbTemplate.instructions),
  schema: parseSupabaseJson(dbTemplate.schema),
  priority_rules: parseSupabaseJson(dbTemplate.priority_rules),
  created_at: dbTemplate.created_at,
  updated_at: dbTemplate.updated_at,
  user_id: dbTemplate.user_id
});