import { templates } from "@/components/template/types";

export const validateTemplateId = (templateId: string): boolean => {
  return templates.some(t => t.id === templateId);
};