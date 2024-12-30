import { templates } from "../../components/template/types";
import type { Template } from "../../components/template/types";

export const getDefaultTemplate = (): Template => templates[0];

export const findTemplateById = (templateId: string): Template | undefined => {
  return templates.find(t => t.id === templateId);
};

export const isTemplateChange = (currentId: string, newTemplate: Template): boolean => {
  return currentId !== newTemplate.id;
};