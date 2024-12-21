import { useEffect } from "react";
import { useAvailableTemplates } from "./useAvailableTemplates";
import { useTemplatePersistence } from "./useTemplatePersistence";
import type { Template } from "@/components/template/templateTypes";

export const useTemplateLoading = (
  onTemplateChange: (template: Template) => void,
  selectedTemplate: Template | null,
  setSelectedTemplate: (template: Template) => void,
  setIsLoading: (loading: boolean) => void,
  globalTemplateRef: React.RefObject<Template>
) => {
  const availableTemplates = useAvailableTemplates();
  const { loadTemplate } = useTemplatePersistence();

  useEffect(() => {
    const loadTemplateForChat = async () => {
      try {
        setIsLoading(true);
        const loadedTemplate = await loadTemplate();
        
        if (loadedTemplate) {
          console.log('[useTemplateLoading] Loaded template:', loadedTemplate.name);
          if (selectedTemplate?.id === loadedTemplate.id) {
            console.log('[useTemplateLoading] Loaded template matches current, skipping update');
            return;
          }
          setSelectedTemplate(loadedTemplate);
          onTemplateChange(loadedTemplate);
        } else {
          console.log('[useTemplateLoading] No saved template, using global template');
          if (selectedTemplate?.id === globalTemplateRef.current.id) {
            console.log('[useTemplateLoading] Global template matches current, skipping update');
            return;
          }
          setSelectedTemplate(globalTemplateRef.current);
          onTemplateChange(globalTemplateRef.current);
        }
      } catch (error) {
        console.error('[useTemplateLoading] Failed to load template:', error);
        setSelectedTemplate(globalTemplateRef.current);
        onTemplateChange(globalTemplateRef.current);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateForChat();
  }, [onTemplateChange, loadTemplate, selectedTemplate, setSelectedTemplate, setIsLoading, globalTemplateRef]);

  return {
    availableTemplates
  };
};