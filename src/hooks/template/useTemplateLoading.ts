import { useEffect, useCallback, useState } from "react";
import { useAvailableTemplates } from "./useAvailableTemplates";
import { useTemplatePersistence } from "./useTemplatePersistence";
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { ErrorTracker } from '@/utils/errorTracking';
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
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleError = useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.STATE, 'useTemplateLoading', `Error during ${operation}:`, {
      error,
      selectedTemplateId: selectedTemplate?.id,
      retryCount,
      timestamp: new Date().toISOString()
    });

    ErrorTracker.trackError(error, {
      component: 'useTemplateLoading',
      severity: retryCount >= MAX_RETRIES ? 'high' : 'medium',
      timestamp: new Date().toISOString(),
      operation,
      additionalInfo: {
        selectedTemplateId: selectedTemplate?.id,
        availableTemplatesCount: availableTemplates.length
      }
    });

    toast({
      title: "Template Error",
      description: `Failed to ${operation}. ${retryCount < MAX_RETRIES ? 'Retrying...' : 'Using default template.'}`,
      variant: "destructive",
    });
  }, [selectedTemplate?.id, retryCount, availableTemplates.length, toast]);

  useEffect(() => {
    const loadTemplateForChat = async () => {
      try {
        setIsLoading(true);
        logger.debug(LogCategory.STATE, 'useTemplateLoading', 'Loading template:', {
          timestamp: new Date().toISOString()
        });

        const templateId = await loadTemplate();
        
        if (templateId) {
          const loadedTemplate = availableTemplates.find(t => t.id === templateId);
          
          if (loadedTemplate) {
            logger.debug(LogCategory.STATE, 'useTemplateLoading', 'Loaded template:', {
              templateName: loadedTemplate.name,
              timestamp: new Date().toISOString()
            });

            if (selectedTemplate?.id === loadedTemplate.id) {
              logger.debug(LogCategory.STATE, 'useTemplateLoading', 'Template already selected, skipping update');
              return;
            }

            setSelectedTemplate(loadedTemplate);
            onTemplateChange(loadedTemplate);
            setRetryCount(0); // Reset retry count on success
          } else {
            logger.debug(LogCategory.STATE, 'useTemplateLoading', 'Using global template (template not found)');
            handleFallbackToGlobalTemplate();
          }
        } else {
          logger.debug(LogCategory.STATE, 'useTemplateLoading', 'Using global template (no saved template)');
          handleFallbackToGlobalTemplate();
        }
      } catch (error) {
        handleError(error as Error, 'load template');
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(loadTemplateForChat, Math.pow(2, retryCount) * 1000);
        } else {
          handleFallbackToGlobalTemplate();
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleFallbackToGlobalTemplate = () => {
      if (selectedTemplate?.id === globalTemplateRef.current.id) {
        logger.debug(LogCategory.STATE, 'useTemplateLoading', 'Global template already selected');
        return;
      }
      setSelectedTemplate(globalTemplateRef.current);
      onTemplateChange(globalTemplateRef.current);
    };

    loadTemplateForChat();
  }, [
    onTemplateChange,
    loadTemplate,
    selectedTemplate,
    setSelectedTemplate,
    setIsLoading,
    globalTemplateRef,
    availableTemplates,
    handleError,
    retryCount
  ]);

  return {
    availableTemplates,
    retryCount
  };
};
