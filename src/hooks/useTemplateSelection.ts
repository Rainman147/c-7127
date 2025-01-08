import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { loadTemplateFromDb, saveTemplateToDb } from "@/utils/template/templateDbOperations";
import { getDefaultTemplate, findTemplateById } from "@/utils/template/templateStateManager";
import type { Template } from "@/components/template/types";

interface UseTemplateSelectionResult {
  selectedTemplate: Template;
  isLoading: boolean;
  error: string | null;
  handleTemplateChange: (template: Template) => Promise<void>;
}

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void,
  initialTemplateId?: string | null
): UseTemplateSelectionResult => {
  console.log('[useTemplateSelection] Initializing with:', { currentChatId, initialTemplateId });
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(() => {
    if (initialTemplateId) {
      const template = findTemplateById(initialTemplateId);
      return template || getDefaultTemplate();
    }
    return getDefaultTemplate();
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load initial template - only runs once on mount or when chat ID changes
  useEffect(() => {
    let isMounted = true;
    
    const loadTemplate = async () => {
      console.log('[useTemplateSelection] Loading template for chat:', currentChatId);
      
      // If we have an initial template ID from URL, use that
      if (initialTemplateId) {
        const template = findTemplateById(initialTemplateId);
        if (template) {
          console.log('[useTemplateSelection] Using template from URL:', template.name);
          setSelectedTemplate(template);
          onTemplateChange(template);
          return;
        }
      }

      // Otherwise, try to load from database if we have a chat ID
      if (currentChatId) {
        try {
          setIsLoading(true);
          setError(null);
          const templateType = await loadTemplateFromDb(currentChatId);
          
          if (templateType && isMounted) {
            const template = findTemplateById(templateType);
            if (template) {
              console.log('[useTemplateSelection] Loaded template from DB:', template.name);
              setSelectedTemplate(template);
              onTemplateChange(template);
            }
          }
        } catch (error) {
          console.error('[useTemplateSelection] Failed to load template:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load template';
          if (isMounted) {
            setError(errorMessage);
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    loadTemplate();
    
    return () => {
      isMounted = false;
    };
  }, [currentChatId, initialTemplateId, onTemplateChange, toast]);

  const handleTemplateChange = useCallback(async (template: Template) => {
    console.log('[useTemplateSelection] Template change requested:', template.name);
    
    if (selectedTemplate.id === template.id) {
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
        console.log('[useTemplateSelection] Template saved to database');
      }
    } catch (error) {
      console.error('[useTemplateSelection] Failed to update template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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