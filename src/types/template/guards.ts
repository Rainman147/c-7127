
import type { Template, TemplateValidationError } from './Template';

/**
 * Validates UUID format for template IDs
 */
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Type guard to check if a template is valid
 */
export const isValidTemplate = (template: unknown): template is Template => {
  if (!template || typeof template !== 'object') {
    console.error('[Template Validation] Invalid template object:', template);
    return false;
  }
  
  const t = template as Partial<Template>;
  
  // Required fields check
  const hasRequiredFields = 
    typeof t.id === 'string' &&
    isValidUUID(t.id) &&
    typeof t.name === 'string' &&
    typeof t.description === 'string' &&
    typeof t.systemInstructions === 'string' &&
    typeof t.content === 'string';

  if (!hasRequiredFields) {
    console.error('[Template Validation] Missing required fields:', {
      hasId: typeof t.id === 'string',
      isValidId: typeof t.id === 'string' && isValidUUID(t.id),
      hasName: typeof t.name === 'string',
      hasDescription: typeof t.description === 'string',
      hasSystemInstructions: typeof t.systemInstructions === 'string',
      hasContent: typeof t.content === 'string'
    });
    return false;
  }

  // Optional fields type check
  const hasValidOptionalFields = 
    (!t.instructions || t.instructions === null || typeof t.instructions === 'object') &&
    (!t.schema || t.schema === null || typeof t.schema === 'object') &&
    (!t.priorityRules || t.priorityRules === null || typeof t.priorityRules === 'object') &&
    (!t.createdAt || typeof t.createdAt === 'string') &&
    (!t.updatedAt || typeof t.updatedAt === 'string') &&
    (!t.userId || typeof t.userId === 'string');

  if (!hasValidOptionalFields) {
    console.error('[Template Validation] Invalid optional fields:', {
      instructions: t.instructions,
      schema: t.schema,
      priorityRules: t.priorityRules,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      userId: t.userId
    });
  }

  return hasRequiredFields && hasValidOptionalFields;
};

/**
 * Type guard to check if a template is a custom template (has userId)
 */
export const isCustomTemplate = (template: Template): boolean => {
  return typeof template.userId === 'string';
};

/**
 * Type guard to check if a template is a default template
 */
export const isDefaultTemplate = (template: Template): boolean => {
  return !template.userId;
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

  if (!data.content?.trim()) {
    errors.push({ field: 'content', message: 'Template content is required' });
  }

  if (data.id && !isValidUUID(data.id)) {
    errors.push({ field: 'id', message: 'Invalid template ID format' });
  }

  return errors.length > 0 ? errors : null;
};

