
import type { Json } from '@/integrations/supabase/types';

export interface Template {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
  content: string;
  instructions?: Record<string, any> | null;
  schema?: Record<string, any> | null;
  priorityRules?: Record<string, any> | null;
  isStandard?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface TemplateContext {
  id: string;
  name: string;
  systemInstructions: string;
  metadata?: Record<string, any>;
}

export type TemplateValidationError = {
  field: keyof Template;
  message: string;
};

// Common validation schemas
export interface TemplateSchema {
  version: string;
  fields: TemplateField[];
  required: string[];
}

export interface TemplateField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  validation?: Record<string, any>;
}

