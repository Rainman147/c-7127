import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadTemplateFromDb, saveTemplateToDb } from "@/utils/template/templateDbOperations";
import { getDefaultTemplate, findTemplateById, isTemplateChange } from "@/utils/template/templateStateManager";
import { defaultTemplates, mergeTemplates } from "./types";
import type { Template } from "./types";

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void
) => {
  console.log('[useTemplateSelection] Hook initialized with chatId:', currentChatId);
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(getDefaultTemplate());
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>(defaultTemplates);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data: dbTemplates, error } = await supabase
          .from('templates')
          .select('*');

        if (error) throw error;

        console.log('[useTemplateSelection] Fetched templates from DB:', dbTemplates);
        const merged = mergeTemplates(dbTemplates || []);
        setAvailableTemplates(merged);
      } catch (error) {
        console.error('[useTemplateSelection] Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

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
      } finally {
        setIsLoading(false);
        console.log('[useTemplateSelection] Template loading completed');
      }
    };

    loadTemplateForChat();
  }, [currentChatId, onTemplateChange]);

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
        await saveTemplateToDb(currentChatId, template.id);
      }
      
      console.log('[useTemplateSelection] Template change completed successfully');
    } catch (error) {
      console.error('[useTemplateSelection] Failed to update template:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, selectedTemplate.id, onTemplateChange]);

  return {
    selectedTemplate,
    availableTemplates,
    isLoading,
    handleTemplateChange
  };
};