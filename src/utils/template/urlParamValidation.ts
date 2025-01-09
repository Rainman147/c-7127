import { templates } from "@/types/template";

export const validateTemplateId = (templateId: string): boolean => {
  return templates.some(t => t.id === templateId);
};