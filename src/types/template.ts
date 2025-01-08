import { Json } from '@/integrations/supabase/types';

export type Template = {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
  content?: string;
  instructions?: Record<string, any> | null;
  schema?: Record<string, any> | null;
  priority_rules?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

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
  instructions: dbTemplate.instructions as Record<string, any> | null,
  schema: dbTemplate.schema as Record<string, any> | null,
  priority_rules: dbTemplate.priority_rules as Record<string, any> | null,
  created_at: dbTemplate.created_at,
  updated_at: dbTemplate.updated_at,
  user_id: dbTemplate.user_id
});