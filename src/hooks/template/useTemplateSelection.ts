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

  // Initialize with default template or load saved template
  useEffect(() => {
    const initializeTemplate = async () => {
      console.log('[useTemplateSelection] Initializing template...');
      
      if (!currentChatId) {
        const defaultTemplate = getDefaultTemplate();
        console.log('[useTemplateSelection] No chat ID, using default template:', defaultTemplate.name);
        setSelectedTemplate(defaultTemplate);
        onTemplateChange(defaultTemplate);
        return;
      }

      try {
        setIsLoading(true);
        const savedTemplate = await loadTemplate();
        
        if (savedTemplate) {
          console.log('[useTemplateSelection] Loaded saved template:', savedTemplate.name);
          setSelectedTemplate(savedTemplate);
          onTemplateChange(savedTemplate);
        } else {
          const defaultTemplate = getDefaultTemplate();
          console.log('[useTemplateSelection] No saved template, using default:', defaultTemplate.name);
          setSelectedTemplate(defaultTemplate);
          onTemplateChange(defaultTemplate);
        }
      } catch (error) {
        console.error('[useTemplateSelection] Error loading template:', error);
        const defaultTemplate = getDefaultTemplate();
        setSelectedTemplate(defaultTemplate);
        onTemplateChange(defaultTemplate);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTemplate();
  }, [currentChatId, onTemplateChange, loadTemplate]);

  const handleTemplateChange = useCallback(async (template: Template) => {
    console.log('[useTemplateSelection] Template change requested:', template.name);
    
    if (!selectedTemplate || template.id !== selectedTemplate.id) {
      setIsLoading(true);
      try {
        setSelectedTemplate(template);
        onTemplateChange(template);
        if (currentChatId) {
          await saveTemplate(template);
          console.log('[useTemplateSelection] Template saved successfully:', template.name);
        }
      } catch (error) {
        console.error('[useTemplateSelection] Failed to update template:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('[useTemplateSelection] Same template selected, no changes needed');
    }
  }, [currentChatId, selectedTemplate, onTemplateChange, saveTemplate]);

  return {
    selectedTemplate: selectedTemplate || getDefaultTemplate(),
    availableTemplates,
    isLoading,
    handleTemplateChange
  };
};