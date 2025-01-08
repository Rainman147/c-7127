import { Json } from '@/integrations/supabase/types';

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
export type DbTemplate = Omit<Template, 'instructions' | 'schema' | 'priority_rules'> & {
  instructions: Json;
  schema: Json;
  priority_rules: Json;
};