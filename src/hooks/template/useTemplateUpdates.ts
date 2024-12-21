import { useCallback } from "react";
import { useTemplatePersistence } from "./useTemplatePersistence";
import type { Template } from "@/components/template/templateTypes";

export const useTemplateUpdates = (
  currentChatId: string | null,
  selectedTemplate: Template | null,
  setSelectedTemplate: (template: Template) => void,
  setIsLoading: (loading: boolean) => void,
  onTemplateChange: (template: Template) => void
) => {
  const { saveTemplate } = useTemplatePersistence(currentChatId);

  const handleTemplateChange = useCallback(async (template: Template) => {
    console.log('[useTemplateUpdates] Template change requested:', template.name);
    
    if (selectedTemplate?.id === template.id) {
      console.log('[useTemplateUpdates] Same template selected, no changes needed');
      return;
    }

    setIsLoading(true);
    try {
      setSelectedTemplate(template);
      onTemplateChange(template);
      if (currentChatId) {
        await saveTemplate(template);
        console.log('[useTemplateUpdates] Template saved to chat successfully');
      }
    } catch (error) {
      console.error('[useTemplateUpdates] Failed to update template:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, selectedTemplate?.id, onTemplateChange, saveTemplate, setSelectedTemplate, setIsLoading]);

  return {
    handleTemplateChange
  };
};