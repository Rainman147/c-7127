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

// Template configuration interface
export interface TemplateConfig {
  defaultTemplate: Template;
  allowCustomTemplates: boolean;
  maxCustomTemplates?: number;
  validationRules?: {
    minNameLength?: number;
    maxNameLength?: number;
    minDescriptionLength?: number;
    maxDescriptionLength?: number;
  };
}

// Template validation errors
export type TemplateValidationError = {
  field: keyof Template;
  message: string;
};

// Template transformation options
export interface TemplateTransformOptions {
  stripHtml?: boolean;
  sanitizeInstructions?: boolean;
  normalizeWhitespace?: boolean;
}