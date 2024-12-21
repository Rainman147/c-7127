import { useCallback } from "react";
import { useTemplatePersistence } from "./useTemplatePersistence";
import type { Template } from "@/components/template/templateTypes";

export const useTemplateUpdates = (
  selectedTemplate: Template | null,
  setSelectedTemplate: (template: Template) => void,
  setIsLoading: (loading: boolean) => void,
  onTemplateChange: (template: Template) => void
) => {
  const { saveTemplate } = useTemplatePersistence();

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
      await saveTemplate(template);
      console.log('[useTemplateUpdates] Template saved successfully');
    } catch (error) {
      console.error('[useTemplateUpdates] Failed to update template:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate?.id, onTemplateChange, saveTemplate, setSelectedTemplate, setIsLoading]);

  return {
    handleTemplateChange
  };
};