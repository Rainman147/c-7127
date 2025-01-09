import { Json } from '@/integrations/supabase/types';
import type { Template, DbTemplate } from './Template';

/**
 * Helper function to safely parse JSON fields
 */
export const parseJsonField = (json: Json | null): Record<string, any> | null => {
  if (!json) return null;
  if (typeof json === 'string') {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
  return json as Record<string, any>;
};

/**
 * Convert a database template to the frontend Template type
 */
export const convertDbTemplate = (dbTemplate: DbTemplate): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  description: dbTemplate.description,
  systemInstructions: dbTemplate.system_instructions, // Map from snake_case to camelCase
  content: dbTemplate.content,
  instructions: parseJsonField(dbTemplate.instructions),
  schema: parseJsonField(dbTemplate.schema),
  priority_rules: parseJsonField(dbTemplate.priority_rules),
  created_at: dbTemplate.created_at,
  updated_at: dbTemplate.updated_at,
  user_id: dbTemplate.user_id
});