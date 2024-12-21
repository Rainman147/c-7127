import { useState, useEffect, useCallback, useRef } from "react";
import { getDefaultTemplate, isTemplateChange } from "@/utils/template/templateStateManager";
import { useAvailableTemplates } from "@/hooks/template/useAvailableTemplates";
import { useTemplatePersistence } from "@/hooks/template/useTemplatePersistence";
import type { Template } from "@/types/templates/base";

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void,
  globalTemplate: Template
) => {
  console.log('[useTemplateSelection] Hook initialized with chatId:', currentChatId);
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(globalTemplate);
  const [isLoading, setIsLoading] = useState(false);
  const previousTemplateId = useRef<string>(globalTemplate.id);
  
  const availableTemplates = useAvailableTemplates();
  const { loadTemplate, saveTemplate } = useTemplatePersistence(currentChatId);

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useTemplateSelection] Using global template:', globalTemplate.name);
        }
        if (previousTemplateId.current !== globalTemplate.id) {
          setSelectedTemplate(globalTemplate);
          onTemplateChange(globalTemplate);
          previousTemplateId.current = globalTemplate.id;
        }
        return;
      }

      try {
        setIsLoading(true);
        const template = await loadTemplate();
        
        if (template) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useTemplateSelection] Loaded template from chat:', template.name);
          }
          if (previousTemplateId.current !== template.id) {
            setSelectedTemplate(template);
            onTemplateChange(template);
            previousTemplateId.current = template.id;
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useTemplateSelection] No saved template, using global');
          }
          if (previousTemplateId.current !== globalTemplate.id) {
            setSelectedTemplate(globalTemplate);
            onTemplateChange(globalTemplate);
            previousTemplateId.current = globalTemplate.id;
          }
        }
      } catch (error) {
        console.error('[useTemplateSelection] Failed to load template:', error);
        if (previousTemplateId.current !== globalTemplate.id) {
          setSelectedTemplate(globalTemplate);
          onTemplateChange(globalTemplate);
          previousTemplateId.current = globalTemplate.id;
        }
      } finally {
        setIsLoading(false);
        console.log('[useTemplateSelection] Template loading completed');
      }
    };

    loadTemplateForChat();
  }, [currentChatId, onTemplateChange, globalTemplate]);

  const handleTemplateChange = useCallback(async (template: Template) => {
    if (!isTemplateChange(previousTemplateId.current, template)) {
      console.log('[useTemplateSelection] Same template selected, skipping update');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[useTemplateSelection] Template change:', template.name);
    }

    setIsLoading(true);
    try {
      setSelectedTemplate(template);
      onTemplateChange(template);
      previousTemplateId.current = template.id;
      if (currentChatId) {
        await saveTemplate(template);
        if (process.env.NODE_ENV === 'development') {
          console.log('[useTemplateSelection] Template saved successfully');
        }
      }
    } catch (error) {
      console.error('[useTemplateSelection] Failed to update template:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, onTemplateChange, saveTemplate]);

  return {
    selectedTemplate,
    availableTemplates,
    isLoading,
    handleTemplateChange
  };
};