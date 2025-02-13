
import { Json } from '@/integrations/supabase/types';
import type { Template, DbTemplate } from './Template';

export const parseJsonField = <T>(field: unknown): T => {
  if (!field) return {} as T;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      return {} as T;
    }
  }
  return field as T;
};

export const isValidTemplateType = (type: string): boolean => {
  return ['soap-note', 'referral', 'discharge', 'live-session'].includes(type);
};

/**
 * Convert a database template to the frontend Template type
 */
export const convertDbTemplate = (dbTemplate: DbTemplate): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  description: dbTemplate.description,
  systemInstructions: dbTemplate.system_instructions,
  content: dbTemplate.content,
  instructions: parseJsonField(dbTemplate.instructions),
  schema: parseJsonField(dbTemplate.schema),
  priorityRules: parseJsonField(dbTemplate.priority_rules),
  createdAt: dbTemplate.created_at,
  updatedAt: dbTemplate.updated_at,
  userId: dbTemplate.user_id,
  isStandard: dbTemplate.is_standard
});
