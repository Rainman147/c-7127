import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { loadTemplateFromDb, saveTemplateToDb } from "@/utils/template/templateDbOperations";
import { getDefaultTemplate, findTemplateById } from "@/utils/template/templateStateManager";
import { useUrlStateManager } from "@/hooks/useUrlStateManager";
import { useDebounce } from "@/hooks/useDebounce";
import type { Template } from "@/components/template/types";

interface UseTemplateSelectionResult {
  selectedTemplate: Template | null;
  isLoading: boolean;
  error: string | null;
  handleTemplateChange: (template: Template) => Promise<void>;
}

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void
): UseTemplateSelectionResult => {
  console.log('[useTemplateSelection] Hook initialized with chatId:', currentChatId);
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(getDefaultTemplate());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const templateType = await loadTemplateFromDb(currentChatId);
        
        if (templateType) {
          const template = findTemplateById(templateType);
          if (template) {
            console.log('[useTemplateSelection] Found template in database:', template.name);
            setSelectedTemplate(template);
            onTemplateChange(template);
          } else {
            throw new Error(`Invalid template type: ${templateType}`);
          }
        }
      } catch (error) {
        console.error('[useTemplateSelection] Failed to load template:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load template settings';
        setError(errorMessage);
        toast({
          title: "Error Loading Template",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Fallback to default template on error
        const defaultTemplate = getDefaultTemplate();
        setSelectedTemplate(defaultTemplate);
        onTemplateChange(defaultTemplate);
      } finally {
        setIsLoading(false);
        console.log('[useTemplateSelection] Template loading completed');
      }
    };

    loadTemplateForChat();
  }, [currentChatId, onTemplateChange, toast]);

  // Handle template changes from URL
  useEffect(() => {
    if (templateId) {
      const template = findTemplateById(templateId);
      if (template) {
        if (!selectedTemplate || selectedTemplate.id !== templateId) {
          console.log('[useTemplateSelection] Loading template from URL:', template.name);
          setSelectedTemplate(template);
          onTemplateChange(template);
          setError(null);
        }
      } else {
        console.error('[useTemplateSelection] Invalid template ID in URL:', templateId);
        const errorMessage = `Invalid template ID: ${templateId}`;
        setError(errorMessage);
        toast({
          title: "Template Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Fallback to default template for invalid URL parameter
        const defaultTemplate = getDefaultTemplate();
        setSelectedTemplate(defaultTemplate);
        onTemplateChange(defaultTemplate);
        updateUrlParameters(defaultTemplate.id, patientId);
      }
    }
  }, [templateId, selectedTemplate, onTemplateChange, toast, patientId, updateUrlParameters]);

  // Update URL when template changes
  useEffect(() => {
    if (debouncedTemplate) {
      console.log('[useTemplateSelection] Updating URL with debounced template:', debouncedTemplate.name);
      updateUrlParameters(debouncedTemplate.id, patientId);
    }
  }, [debouncedTemplate, patientId, updateUrlParameters]);

  const handleTemplateChange = useCallback(async (template: Template) => {
    console.log('[useTemplateSelection] Template change requested:', template.name);
    
    if (selectedTemplate?.id === template.id) {
      console.log('[useTemplateSelection] Same template selected, no changes needed');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      setSelectedTemplate(template);
      onTemplateChange(template);

      if (currentChatId) {
        await saveTemplateToDb(currentChatId, template.id);
      }
      
      console.log('[useTemplateSelection] Template change completed successfully');
    } catch (error) {
      console.error('[useTemplateSelection] Failed to update template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Revert to previous template on error
      if (selectedTemplate) {
        setSelectedTemplate(selectedTemplate);
        onTemplateChange(selectedTemplate);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, selectedTemplate, onTemplateChange, toast]);

  return {
    selectedTemplate,
    isLoading,
    error,
    handleTemplateChange
  };
};