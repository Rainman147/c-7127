import type { Template } from './Template';

/**
 * Type guard to check if a template is valid
 */
export const isValidTemplate = (template: unknown): template is Template => {
  if (!template || typeof template !== 'object') return false;
  
  const t = template as Partial<Template>;
  
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.description === 'string' &&
    typeof t.systemInstructions === 'string'
  );
};

/**
 * Type guard to check if a template is a custom template (has user_id)
 */
export const isCustomTemplate = (template: Template): boolean => {
  return typeof template.user_id === 'string';
};

/**
 * Type guard to check if a template is a default template
 */
export const isDefaultTemplate = (template: Template): boolean => {
  return !template.user_id;
};

/**
 * Validates template data before saving
 */
export const validateTemplateData = (data: Partial<Template>): string | null => {
  if (!data.name?.trim()) return 'Template name is required';
  if (!data.description?.trim()) return 'Template description is required';
  if (!data.systemInstructions?.trim()) return 'System instructions are required';
  return null;
};