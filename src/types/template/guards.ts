import type { Template } from './Template';

export const isValidTemplate = (template: unknown): template is Template => {
  if (!template || typeof template !== 'object') {
    console.warn('[isValidTemplate] Template is not an object:', template);
    return false;
  }

  const t = template as Template;
  
  const hasRequiredFields = 
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.description === 'string' &&
    typeof t.systemInstructions === 'string';

  if (!hasRequiredFields) {
    console.warn('[isValidTemplate] Template missing required fields:', t);
    return false;
  }

  // Additional validation for non-empty strings
  if (!t.id.trim() || !t.name.trim() || !t.description.trim() || !t.systemInstructions.trim()) {
    console.warn('[isValidTemplate] Template has empty required fields:', t);
    return false;
  }

  return true;
};