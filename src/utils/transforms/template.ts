
import type { DbTemplate } from '@/types/database';
import type { Template } from '@/types/template/Template';
import { Json } from '@/integrations/supabase/types';

const parseJsonField = <T>(field: Json | null): T | undefined => {
  if (!field) return undefined;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      return undefined;
    }
  }
  return field as T;
};

/**
 * Converts a database template to frontend format
 * Following our conventions for camelCase in frontend
 */
export const toFrontendTemplate = (dbTemplate: DbTemplate): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  description: dbTemplate.description,
  systemInstructions: dbTemplate.system_instructions,
  content: dbTemplate.content,
  instructions: parseJsonField<Record<string, any>>(dbTemplate.instructions),
  schema: parseJsonField<Record<string, any>>(dbTemplate.schema),
  priorityRules: parseJsonField<Record<string, any>>(dbTemplate.priority_rules),
  createdAt: dbTemplate.created_at,
  updatedAt: dbTemplate.updated_at,
  userId: dbTemplate.user_id,
  isStandard: dbTemplate.is_standard
});

/**
 * Converts a frontend template to database format
 * Following our conventions for snake_case in database
 */
export const toDatabaseTemplate = (template: Partial<Template>): Partial<DbTemplate> => ({
  name: template.name,
  description: template.description,
  system_instructions: template.systemInstructions,
  content: template.content,
  instructions: template.instructions as Json,
  schema: template.schema as Json,
  priority_rules: template.priorityRules as Json,
  is_standard: template.isStandard,
  user_id: template.userId
});

