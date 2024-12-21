import type { Template } from './base';
import type { Json } from '@/integrations/supabase/types';
import { defaultTemplates } from './defaults';

export type DatabaseInstructions = {
  dataFormatting: string;
  priorityRules: string;
  specialConditions: string;
};

export type DatabaseSchema = {
  sections: string[];
  requiredFields: string[];
};

export interface DatabaseTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
  instructions: DatabaseInstructions | Json;
  schema: DatabaseSchema | Json;
  priority_rules?: Json;
}

const isValidInstructions = (instructions: any): instructions is DatabaseInstructions => {
  return (
    typeof instructions === 'object' &&
    typeof instructions.dataFormatting === 'string' &&
    typeof instructions.priorityRules === 'string' &&
    typeof instructions.specialConditions === 'string'
  );
};

const isValidSchema = (schema: any): schema is DatabaseSchema => {
  return (
    typeof schema === 'object' &&
    Array.isArray(schema.sections) &&
    Array.isArray(schema.requiredFields)
  );
};

export const convertDatabaseTemplate = (template: DatabaseTemplate): Template => {
  console.log('[convertDatabaseTemplate] Converting template:', template);
  
  const defaultInstructions = {
    dataFormatting: '',
    priorityRules: '',
    specialConditions: ''
  };

  const defaultSchema = {
    sections: [],
    requiredFields: []
  };

  return {
    id: template.id,
    name: template.name,
    description: template.content || '',
    systemInstructions: template.content || '',
    content: template.content || '',
    instructions: isValidInstructions(template.instructions) 
      ? template.instructions 
      : defaultInstructions,
    schema: isValidSchema(template.schema) 
      ? template.schema 
      : defaultSchema,
    priority_rules: template.priority_rules
  };
};

// Function to merge database templates with default ones
export const mergeTemplates = (dbTemplates: DatabaseTemplate[]): Template[] => {
  console.log('[mergeTemplates] Merging templates:', { 
    defaultCount: defaultTemplates.length, 
    dbCount: dbTemplates.length 
  });
  
  const converted = dbTemplates.map(convertDatabaseTemplate);
  return [...defaultTemplates, ...converted];
};