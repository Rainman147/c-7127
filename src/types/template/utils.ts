import { Json } from '@/integrations/supabase/types';
import type { Template, DbTemplate, TemplateTransformOptions } from './Template';
import { isValidTemplate } from './guards';

// Helper function to safely parse JSON fields
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

// Convert a database template to the frontend Template type
export const convertDbTemplate = (dbTemplate: DbTemplate): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  description: dbTemplate.description,
  systemInstructions: dbTemplate.systemInstructions,
  content: dbTemplate.content,
  instructions: parseJsonField(dbTemplate.instructions),
  schema: parseJsonField(dbTemplate.schema),
  priority_rules: parseJsonField(dbTemplate.priority_rules),
  created_at: dbTemplate.created_at,
  updated_at: dbTemplate.updated_at,
  user_id: dbTemplate.user_id
});

// Transform template data based on options
export const transformTemplate = (
  template: Template, 
  options: TemplateTransformOptions = {}
): Template => {
  if (!isValidTemplate(template)) {
    throw new Error('Invalid template data');
  }

  const transformed = { ...template };

  if (options.stripHtml) {
    transformed.description = transformed.description.replace(/<[^>]*>/g, '');
    transformed.systemInstructions = transformed.systemInstructions.replace(/<[^>]*>/g, '');
  }

  if (options.normalizeWhitespace) {
    transformed.description = transformed.description.trim().replace(/\s+/g, ' ');
    transformed.systemInstructions = transformed.systemInstructions.trim().replace(/\s+/g, ' ');
  }

  return transformed;
};

// Normalize template data for consistency
export const normalizeTemplate = (template: Template): Template => {
  return transformTemplate(template, {
    stripHtml: true,
    sanitizeInstructions: true,
    normalizeWhitespace: true
  });
};