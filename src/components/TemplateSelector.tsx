import { memo, useCallback, useEffect, useMemo } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TemplateTrigger } from "./template/dropdown/TemplateTrigger";
import { TemplateDropdownContent } from "./template/dropdown/TemplateDropdownContent";
import { useTemplateSelection } from "./template/useTemplateSelection";
import { useSessionParams } from "@/hooks/routing/useSessionParams";
import { useTemplateContext } from "@/contexts/TemplateContext";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@/components/template/templateTypes";
import { logger, LogCategory } from "@/utils/logging";

interface TemplateSelectorProps {
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ onTemplateChange }: TemplateSelectorProps) => {
  const { sessionId, templateId, redirectToSession } = useSessionParams();
  const { globalTemplate } = useTemplateContext();
  const { toast } = useToast();
  
  useEffect(() => {
    logger.debug(LogCategory.RENDER, 'TemplateSelector', 'Component mounted/updated:', {
      sessionId,
      templateId
    });

    return () => {
      logger.debug(LogCategory.RENDER, 'TemplateSelector', 'Component cleanup for chat:', sessionId);
    };
  }, [sessionId, templateId]);

  const { 
    selectedTemplate, 
    availableTemplates, 
    isLoading, 
    handleTemplateChange 
  } = useTemplateSelection(onTemplateChange, globalTemplate);

  const handleTemplateSelect = useCallback(async (template: Template) => {
    logger.info(LogCategory.STATE, 'TemplateSelector', 'Template selection requested:', {
      sessionId,
      currentTemplateId: selectedTemplate?.id,
      newTemplateId: template.id,
      templateName: template.name
    });

    if (template.id === selectedTemplate?.id) {
      logger.debug(LogCategory.STATE, 'TemplateSelector', 'Skipping duplicate template selection');
      return;
    }
    
    try {
      // Update URL and handle template change
      if (sessionId) {
        redirectToSession(sessionId, { template: template.id });
      }
      
      handleTemplateChange(template);
      
      toast({
        title: "Template Changed",
        description: `Switched to ${template.name} template`,
      });
    } catch (error) {
      logger.error(LogCategory.ERROR, 'TemplateSelector', 'Error changing template:', error);
      toast({
        title: "Error",
        description: "Failed to change template. Please try again.",
        variant: "destructive",
      });
    }
  }, [handleTemplateChange, sessionId, selectedTemplate?.id, redirectToSession, toast]);

  const displayTemplate = useMemo(() => {
    logger.debug(LogCategory.STATE, 'TemplateSelector', 'Display template updated:', {
      sessionId,
      templateId: selectedTemplate?.id,
      templateName: selectedTemplate?.name
    });
    return selectedTemplate;
  }, [selectedTemplate, sessionId]);

  return (
    <DropdownMenu>
      <TemplateTrigger 
        displayTemplate={displayTemplate}
        isLoading={isLoading}
      />
      <TemplateDropdownContent 
        templates={availableTemplates}
        selectedTemplateId={displayTemplate?.id}
        onTemplateSelect={handleTemplateSelect}
        isLoading={isLoading}
      />
    </DropdownMenu>
  );
});

TemplateSelector.displayName = 'TemplateSelector';