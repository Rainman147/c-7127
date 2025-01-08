import type { Template, TemplateValidationError } from './Template';

/**
 * Type guard to check if a template is valid
 */
export const isValidTemplate = (template: unknown): template is Template => {
  if (!template || typeof template !== 'object') return false;
  
  const t = template as Partial<Template>;
  
  // Required fields check
  const hasRequiredFields = 
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.description === 'string' &&
    typeof t.systemInstructions === 'string';

  // Optional fields type check
  const hasValidOptionalFields = 
    (!t.content || typeof t.content === 'string') &&
    (!t.instructions || t.instructions === null || typeof t.instructions === 'object') &&
    (!t.schema || t.schema === null || typeof t.schema === 'object') &&
    (!t.priority_rules || t.priority_rules === null || typeof t.priority_rules === 'object') &&
    (!t.created_at || typeof t.created_at === 'string') &&
    (!t.updated_at || typeof t.updated_at === 'string') &&
    (!t.user_id || typeof t.user_id === 'string');

  return hasRequiredFields && hasValidOptionalFields;
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
 * Returns array of validation errors or null if valid
 */
export const validateTemplateData = (data: Partial<Template>): TemplateValidationError[] | null => {
  const errors: TemplateValidationError[] = [];

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Template name is required' });
  }

  if (!data.description?.trim()) {
    errors.push({ field: 'description', message: 'Template description is required' });
  }

  if (!data.systemInstructions?.trim()) {
    errors.push({ field: 'systemInstructions', message: 'System instructions are required' });
  }

  return errors.length > 0 ? errors : null;
};