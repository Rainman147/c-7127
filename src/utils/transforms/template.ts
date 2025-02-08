
import type { DbTemplate } from '@/types/database';
import type { Template } from '@/types/template';

export const toFrontendTemplate = (dbTemplate: DbTemplate): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  description: dbTemplate.description,
  systemInstructions: dbTemplate.system_instructions,
  content: dbTemplate.content,
  instructions: dbTemplate.instructions,
  schema: dbTemplate.schema,
  priorityRules: dbTemplate.priority_rules,
  createdAt: dbTemplate.created_at,
  updatedAt: dbTemplate.updated_at,
  userId: dbTemplate.user_id,
  isStandard: dbTemplate.is_standard
});

export const toDatabaseTemplate = (template: Partial<Template>): Partial<DbTemplate> => ({
  name: template.name,
  description: template.description,
  system_instructions: template.systemInstructions,
  content: template.content,
  instructions: template.instructions,
  schema: template.schema,
  priority_rules: template.priorityRules,
  is_standard: template.isStandard,
  user_id: template.userId
});
