import { Template } from './base';
import { defaultTemplates } from './defaults';

export type DatabaseTemplate = {
  id: string;
  name: string;
  content: string;
  instructions?: {
    dataFormatting?: string;
    priorityRules?: string;
    specialConditions?: string;
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
  description: dbTemplate.content || '', // Use content as description
  systemInstructions: dbTemplate.content || '', // Use content as system instructions
  content: dbTemplate.content,
  instructions: dbTemplate.instructions,
  schema: dbTemplate.schema,
  priority_rules: dbTemplate.priority_rules
});

export const mergeTemplates = (dbTemplates: DatabaseTemplate[]): Template[] => {
  const converted = dbTemplates.map(convertDatabaseTemplate);
  return [...defaultTemplates, ...converted];
};