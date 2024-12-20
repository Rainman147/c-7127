import type { Template } from './base';
import { defaultTemplates } from './defaults';

export type DatabaseTemplate = {
  id: string;
  name: string;
  content: string;
  instructions?: {
    dataFormatting: string;
    priorityRules: string;
    specialConditions: string;
  };
  schema?: {
    sections: string[];
    requiredFields: string[];
  };
  priority_rules?: any;
};

export const convertDatabaseTemplate = (dbTemplate: DatabaseTemplate): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  description: dbTemplate.content || '',
  systemInstructions: dbTemplate.content || '',
  content: dbTemplate.content,
  instructions: dbTemplate.instructions || {
    dataFormatting: '',
    priorityRules: '',
    specialConditions: ''
  },
  schema: dbTemplate.schema || {
    sections: [],
    requiredFields: []
  },
  priority_rules: dbTemplate.priority_rules
});

export const mergeTemplates = (dbTemplates: DatabaseTemplate[]): Template[] => {
  const converted = dbTemplates.map(convertDatabaseTemplate);
  return [...defaultTemplates, ...converted];
};