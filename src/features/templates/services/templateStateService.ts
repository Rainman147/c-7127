import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { loadTemplateFromDb, saveTemplateToDb } from '@/utils/template/templateDbOperations';
import { getDefaultTemplate, findTemplateById } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/types';

interface UseTemplateStateProps {
  currentChatId: string | null;
  initialTemplateId?: string | null;
  onTemplateChange: (template: Template) => void;
}

export const useTemplateStateService = ({ 
  currentChatId, 
  initialTemplateId,
  onTemplateChange 
}: UseTemplateStateProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(getDefaultTemplate());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  console.log('[TemplateStateService] Initializing with:', { 
    currentChatId, 
    initialTemplateId,
    selectedTemplateId: selectedTemplate.id 
  });

  useEffect(() => {
    const loadTemplate = async () => {
      if (!currentChatId && !initialTemplateId) {
        console.log('[TemplateStateService] No template to load, using default');
        const defaultTemplate = getDefaultTemplate();
        setSelectedTemplate(defaultTemplate);
        onTemplateChange(defaultTemplate);
        return;
      }

      try {
        setIsLoading(true);
        
        if (initialTemplateId) {
          const template = findTemplateById(initialTemplateId);
          if (template) {
            console.log('[TemplateStateService] Loading template from URL:', template.name);
            setSelectedTemplate(template);
            onTemplateChange(template);
            return;
          }
        }

        if (currentChatId) {
          const templateType = await loadTemplateFromDb(currentChatId);
          if (templateType) {
            const template = findTemplateById(templateType);
            if (template) {
              console.log('[TemplateStateService] Loaded template from database:', template.name);
              setSelectedTemplate(template);
              onTemplateChange(template);
            }
          }
        }
      } catch (error) {
        console.error('[TemplateStateService] Error loading template:', error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [currentChatId, initialTemplateId, onTemplateChange, toast]);

  const handleTemplateChange = useCallback(async (template: Template) => {
    console.log('[TemplateStateService] Template change requested:', template.name);
    
    setIsLoading(true);
    try {
      setSelectedTemplate(template);
      onTemplateChange(template);

      if (currentChatId) {
        await saveTemplateToDb(currentChatId, template.id);
      }

      toast({
        title: "Template Changed",
        description: `Now using: ${template.name}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('[TemplateStateService] Failed to update template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, onTemplateChange, toast]);

  return {
    selectedTemplate,
    isLoading,
    handleTemplateChange
  };
};