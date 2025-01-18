import type { Template } from './Template';

/**
 * Type guard to check if a template is valid - temporarily simplified during migration
 */
export const isValidTemplate = (template: unknown): template is Template => {
  if (!template || typeof template !== 'object') {
    console.log('[isValidTemplate] Invalid template object:', template);
    return false;
  }
  
  const t = template as Partial<Template>;
  
  // Basic type checking only during migration
  const hasRequiredFields = 
    typeof t.id === 'string' &&
    typeof t.name === 'string';

  if (!hasRequiredFields) {
    console.log('[isValidTemplate] Missing basic required fields:', {
      id: typeof t.id,
      name: typeof t.name,
    });
    return false;
  }

  return true;
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
 * Validates template data before saving - temporarily simplified during migration
 */
export const validateTemplateData = (data: Partial<Template>): { field: keyof Template; message: string; }[] | null => {
  const errors: { field: keyof Template; message: string; }[] = [];

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Template name is required' });
  }

  return errors.length > 0 ? errors : null;
};