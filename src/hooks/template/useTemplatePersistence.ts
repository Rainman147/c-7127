import { useCallback } from "react";
import { loadTemplateFromDb, saveTemplateToDb } from "@/utils/template/templateDbOperations";
import { findTemplateById } from "@/utils/template/templateStateManager";
import type { Template } from "@/components/template/types";

export const useTemplatePersistence = (currentChatId: string | null) => {
  const loadTemplate = useCallback(async () => {
    if (!currentChatId) {
      console.log('[useTemplatePersistence] No chat ID provided');
      return null;
    }

    try {
      const templateType = await loadTemplateFromDb(currentChatId);
      if (templateType) {
        const template = findTemplateById(templateType);
        if (template) {
          console.log('[useTemplatePersistence] Found template in database:', template.name);
          return template;
        }
      }
    } catch (error) {
      console.error('[useTemplatePersistence] Failed to load template:', error);
    }
    return null;
  }, [currentChatId]);

  const saveTemplate = useCallback(async (template: Template) => {
    if (!currentChatId) {
      console.log('[useTemplatePersistence] No chat ID provided, skipping save');
      return;
    }

    try {
      await saveTemplateToDb(currentChatId, template.id);
      console.log('[useTemplatePersistence] Template saved successfully');
    } catch (error) {
      console.error('[useTemplatePersistence] Failed to save template:', error);
    }
  }, [currentChatId]);

  return { loadTemplate, saveTemplate };
};