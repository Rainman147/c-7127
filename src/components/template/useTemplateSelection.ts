import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { loadTemplateFromDb, saveTemplateToDb } from "@/utils/template/templateDbOperations";
import { getDefaultTemplate, findTemplateById, isTemplateChange } from "@/utils/template/templateStateManager";
import type { Template } from "./types";

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void
) => {
  console.log('[useTemplateSelection] Hook initialized with chatId:', currentChatId);
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(getDefaultTemplate());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) {
        console.log('[useTemplateSelection] No chat ID provided, using current template');
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

      // Only save to database if we have a chat ID
      if (currentChatId) {
        await saveTemplateToDb(currentChatId, template.id);
      }

      toast({
        title: "Template Changed",
        description: `Now using: ${template.name}`,
        duration: 3000,
      });
      
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