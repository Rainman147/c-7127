import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { loadTemplateFromDb, saveTemplateToDb } from "@/utils/template/templateDbOperations";
import { getDefaultTemplate, findTemplateById } from "@/utils/template/templateStateManager";
import { useUrlStateManager } from "@/hooks/useUrlStateManager";
import { useDebounce } from "@/hooks/useDebounce";
import type { Template } from "./types";

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void
) => {
  console.log('[useTemplateSelection] Hook initialized with chatId:', currentChatId);
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(getDefaultTemplate());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { templateId, patientId, updateUrlParameters } = useUrlStateManager(currentChatId);
  
  // Debounce template changes to avoid excessive URL updates
  const debouncedTemplate = useDebounce(selectedTemplate, 300);

  // Load template from database when chat ID changes
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
        const templateType = await loadTemplateFromDb(currentChatId);
        
        if (templateType) {
          const template = findTemplateById(templateType);
          if (template) {
            console.log('[useTemplateSelection] Found template in database:', template.name);
            setSelectedTemplate(template);
            onTemplateChange(template);
          }
        }
      } catch (error) {
        console.error('[useTemplateSelection] Failed to load template:', error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.log('[useTemplateSelection] Template loading completed');
      }
    };

    loadTemplateForChat();
  }, [currentChatId, onTemplateChange, toast]);

  // Handle template changes from URL
  useEffect(() => {
    if (templateId && (!selectedTemplate || selectedTemplate.id !== templateId)) {
      const template = findTemplateById(templateId);
      if (template) {
        console.log('[useTemplateSelection] Loading template from URL:', template.name);
        setSelectedTemplate(template);
        onTemplateChange(template);
      }
    }
  }, [templateId, selectedTemplate, onTemplateChange]);

  // Update URL when template changes
  useEffect(() => {
    if (debouncedTemplate) {
      console.log('[useTemplateSelection] Updating URL with debounced template:', debouncedTemplate.name);
      updateUrlParameters(debouncedTemplate.id, patientId);
    }
  }, [debouncedTemplate, patientId, updateUrlParameters]);

  const handleTemplateChange = useCallback(async (template: Template) => {
    console.log('[useTemplateSelection] Template change requested:', template.name);
    
    if (selectedTemplate.id === template.id) {
      console.log('[useTemplateSelection] Same template selected, no changes needed');
      return;
    }

    setIsLoading(true);
    try {
      setSelectedTemplate(template);
      onTemplateChange(template);

      if (currentChatId) {
        await saveTemplateToDb(currentChatId, template.id);
      }
      
      console.log('[useTemplateSelection] Template change completed successfully');
    } catch (error) {
      console.error('[useTemplateSelection] Failed to update template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, selectedTemplate.id, onTemplateChange, toast]);

  return {
    selectedTemplate,
    isLoading,
    handleTemplateChange
  };
};