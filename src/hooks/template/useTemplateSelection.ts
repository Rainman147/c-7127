import { useState, useEffect, useCallback } from "react";
import { getDefaultTemplate, isTemplateChange } from "@/utils/template/templateStateManager";
import { useAvailableTemplates } from "@/hooks/template/useAvailableTemplates";
import { useTemplatePersistence } from "@/hooks/template/useTemplatePersistence";
import type { Template } from "@/components/template/types";

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void
) => {
  console.log('[useTemplateSelection] Hook initialized with chatId:', currentChatId);
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(getDefaultTemplate());
  const [isLoading, setIsLoading] = useState(false);
  
  const availableTemplates = useAvailableTemplates();
  const { loadTemplate, saveTemplate } = useTemplatePersistence(currentChatId);

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) {
        console.log('[useTemplateSelection] No chat ID provided, using default template');
        const defaultTemplate = getDefaultTemplate();
        setSelectedTemplate(defaultTemplate);
        onTemplateChange(defaultTemplate);
        return;
      }

      try {
        setIsLoading(true);
        const template = await loadTemplate();
        
        if (template) {
          console.log('[useTemplateSelection] Loaded template from DB:', template.name);
          setSelectedTemplate(template);
          onTemplateChange(template);
        }
      } catch (error) {
        console.error('[useTemplateSelection] Failed to load template:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateForChat();
  }, [currentChatId, onTemplateChange, loadTemplate]);

  const handleTemplateChange = useCallback(async (template: Template) => {
    console.log('[useTemplateSelection] Template change requested:', template.name);
    
    if (!isTemplateChange(selectedTemplate.id, template)) {
      console.log('[useTemplateSelection] Same template selected, no changes needed');
      return;
    }

    setIsLoading(true);
    try {
      setSelectedTemplate(template);
      onTemplateChange(template);
      if (currentChatId) {
        await saveTemplate(template);
      }
      console.log('[useTemplateSelection] Template change completed successfully:', template.name);
    } catch (error) {
      console.error('[useTemplateSelection] Failed to update template:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, selectedTemplate.id, onTemplateChange, saveTemplate]);

  return {
    selectedTemplate,
    availableTemplates,
    isLoading,
    handleTemplateChange
  };
};