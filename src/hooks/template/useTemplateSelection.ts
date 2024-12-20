import { useState, useEffect, useCallback, useRef } from "react";
import { getDefaultTemplate, isTemplateChange } from "@/utils/template/templateStateManager";
import { useAvailableTemplates } from "@/hooks/template/useAvailableTemplates";
import { useTemplatePersistence } from "@/hooks/template/useTemplatePersistence";
import type { Template } from "@/components/template/types";

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void,
  globalTemplate: Template
) => {
  const isFirstRender = useRef(true);
  const previousChatId = useRef<string | null>(null);
  
  // Only log on first render or when chatId changes
  if ((isFirstRender.current || previousChatId.current !== currentChatId) && process.env.NODE_ENV === 'development') {
    console.log('[useTemplateSelection] Hook initialized with chatId:', currentChatId);
    isFirstRender.current = false;
    previousChatId.current = currentChatId;
  }
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(globalTemplate);
  const [isLoading, setIsLoading] = useState(false);
  
  const availableTemplates = useAvailableTemplates();
  const { loadTemplate, saveTemplate } = useTemplatePersistence(currentChatId);

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) {
        setSelectedTemplate(globalTemplate);
        onTemplateChange(globalTemplate);
        return;
      }

      try {
        setIsLoading(true);
        const template = await loadTemplate();
        
        if (template) {
          if (process.env.NODE_ENV === 'development' && template.id !== selectedTemplate.id) {
            console.log('[useTemplateSelection] Loaded template from chat:', template.name);
          }
          setSelectedTemplate(template);
          onTemplateChange(template);
        } else {
          setSelectedTemplate(globalTemplate);
          onTemplateChange(globalTemplate);
        }
      } catch (error) {
        console.error('[useTemplateSelection] Failed to load template:', error);
        setSelectedTemplate(globalTemplate);
        onTemplateChange(globalTemplate);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateForChat();
  }, [currentChatId, onTemplateChange, globalTemplate, loadTemplate, selectedTemplate.id]);

  const handleTemplateChange = useCallback(async (template: Template) => {
    if (!isTemplateChange(selectedTemplate.id, template)) {
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[useTemplateSelection] Template change:', template.name);
    }

    setIsLoading(true);
    try {
      setSelectedTemplate(template);
      onTemplateChange(template);
      if (currentChatId) {
        await saveTemplate(template);
      }
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