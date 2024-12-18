import { defaultTemplates } from "../../components/template/types";
import type { Template } from "../../components/template/types";

export const getDefaultTemplate = (): Template => defaultTemplates[0];

export const findTemplateById = (templateId: string): Template | undefined => {
  return defaultTemplates.find(t => t.id === templateId);
};

export const isTemplateChange = (currentId: string, newTemplate: Template): boolean => {
  return currentId !== newTemplate.id;
};