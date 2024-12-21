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

// Function to merge database templates with default ones
export const mergeTemplates = (dbTemplates: DatabaseTemplate[]): Template[] => {
  const converted = dbTemplates.map(template => ({
    id: template.id,
    name: template.name,
    description: template.content || '',
    systemInstructions: template.content || '',
    content: template.content || '',
    instructions: typeof template.instructions === 'object' ? template.instructions : {
      dataFormatting: '',
      priorityRules: '',
      specialConditions: ''
    },
    schema: typeof template.schema === 'object' ? template.schema : {
      sections: [],
      requiredFields: []
    },
    priority_rules: template.priority_rules
  }));
  
  return [...defaultTemplates, ...converted];
};