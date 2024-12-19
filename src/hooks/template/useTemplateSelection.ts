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
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const availableTemplates = useAvailableTemplates();
  const { loadTemplate, saveTemplate } = useTemplatePersistence(currentChatId);

  // Initialize with default template only if no template is selected
  useEffect(() => {
    if (!selectedTemplate) {
      const defaultTemplate = getDefaultTemplate();
      console.log('[useTemplateSelection] Initializing with default template:', defaultTemplate.name);
      setSelectedTemplate(defaultTemplate);
      onTemplateChange(defaultTemplate);
    }
  }, [selectedTemplate, onTemplateChange]);

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) {
        console.log('[useTemplateSelection] No chat ID provided');
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
    
    if (selectedTemplate && !isTemplateChange(selectedTemplate.id, template)) {
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
  }, [currentChatId, selectedTemplate, onTemplateChange, saveTemplate]);

  return {
    selectedTemplate: selectedTemplate || getDefaultTemplate(), // Ensure we always return a template
    availableTemplates,
    isLoading,
    handleTemplateChange
  };
};