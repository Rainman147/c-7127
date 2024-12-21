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

export type DatabaseTemplate = {
  id: string;
  name: string;
  content: string;
  instructions?: DatabaseInstructions | Json | null;
  schema?: DatabaseSchema | Json | null;
  priority_rules?: Json | null;
  created_at?: string;
  updated_at?: string;
  user_id: string;
};

const isValidInstructions = (instructions: any): instructions is DatabaseInstructions => {
  return (
    instructions &&
    typeof instructions === 'object' &&
    'dataFormatting' in instructions &&
    'priorityRules' in instructions &&
    'specialConditions' in instructions &&
    typeof instructions.dataFormatting === 'string' &&
    typeof instructions.priorityRules === 'string' &&
    typeof instructions.specialConditions === 'string'
  );
};

const isValidSchema = (schema: any): schema is DatabaseSchema => {
  return (
    schema &&
    typeof schema === 'object' &&
    Array.isArray(schema.sections) &&
    Array.isArray(schema.requiredFields) &&
    schema.sections.every((s: any) => typeof s === 'string') &&
    schema.requiredFields.every((f: any) => typeof f === 'string')
  );
};

export const convertDatabaseTemplate = (dbTemplate: DatabaseTemplate): Template => {
  console.log('[convertDatabaseTemplate] Converting template:', dbTemplate);
  
  const defaultInstructions = {
    dataFormatting: '',
    priorityRules: '',
    specialConditions: ''
  };

  const defaultSchema = {
    sections: [],
    requiredFields: []
  };

  let instructions = defaultInstructions;
  if (dbTemplate.instructions && isValidInstructions(dbTemplate.instructions)) {
    instructions = dbTemplate.instructions;
  }

  let schema = defaultSchema;
  if (dbTemplate.schema && isValidSchema(dbTemplate.schema)) {
    schema = dbTemplate.schema;
  }

  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.content || '',
    systemInstructions: dbTemplate.content || '',
    content: dbTemplate.content || '',
    instructions,
    schema,
    priority_rules: dbTemplate.priority_rules
  };
};

export const mergeTemplates = (dbTemplates: DatabaseTemplate[]): Template[] => {
  const converted = dbTemplates.map(convertDatabaseTemplate);
  return [...defaultTemplates, ...converted];
};