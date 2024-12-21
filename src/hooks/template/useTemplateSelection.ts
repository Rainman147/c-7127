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
  const globalTemplateRef = useRef(globalTemplate);
  
  const availableTemplates = useAvailableTemplates();
  const { loadTemplate, saveTemplate } = useTemplatePersistence(currentChatId);

  // Update ref when globalTemplate changes without triggering effect
  useEffect(() => {
    globalTemplateRef.current = globalTemplate;
  }, [globalTemplate]);

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) {
        console.log('[useTemplateSelection] No chat ID provided, using global template');
        setSelectedTemplate(globalTemplateRef.current);
        onTemplateChange(globalTemplateRef.current);
        return;
      }

      try {
        setIsLoading(true);
        const template = await loadTemplate();
        
        if (template) {
          console.log('[useTemplateSelection] Loaded template from chat:', template.name);
          setSelectedTemplate(template);
          onTemplateChange(template);
        } else {
          console.log('[useTemplateSelection] No saved template, using global template');
          setSelectedTemplate(globalTemplateRef.current);
          onTemplateChange(globalTemplateRef.current);
        }
      } catch (error) {
        console.error('[useTemplateSelection] Failed to load template:', error);
        setSelectedTemplate(globalTemplateRef.current);
        onTemplateChange(globalTemplateRef.current);
      } finally {
        setIsLoading(false);
        console.log('[useTemplateSelection] Template loading completed');
      }
    };

    loadTemplateForChat();
  }, [currentChatId, onTemplateChange, loadTemplate]); // Removed globalTemplate from deps

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
        console.log('[useTemplateSelection] Template saved to chat successfully');
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