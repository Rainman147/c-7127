import { findTemplateById } from './templateStateManager';

export const validateTemplateId = (templateId: string | null): boolean => {
  if (!templateId) return false;
  const template = findTemplateById(templateId);
  return !!template;
};

export const sanitizeUrlParams = (params: URLSearchParams): URLSearchParams => {
  const newParams = new URLSearchParams(params);
  
  // Validate templateId
  const templateId = params.get('templateId');
  if (templateId && !validateTemplateId(templateId)) {
    newParams.delete('templateId');
    console.warn('[URL Validation] Invalid templateId removed:', templateId);
  }
  
  return newParams;
};