import { memo, useCallback, useEffect, useMemo } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TemplateTrigger } from "./template/dropdown/TemplateTrigger";
import { TemplateDropdownContent } from "./template/dropdown/TemplateDropdownContent";
import { useTemplateSelection } from "./template/useTemplateSelection";
import { useSessionParams } from "@/hooks/routing/useSessionParams";
import { useTemplateContext } from "@/contexts/TemplateContext";
import type { Template } from "@/components/template/templateTypes";

interface TemplateSelectorProps {
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ onTemplateChange }: TemplateSelectorProps) => {
  const { sessionId, templateId } = useSessionParams();
  const { globalTemplate } = useTemplateContext();
  
  useEffect(() => {
    console.log('[TemplateSelector] Component mounted/updated:', {
      sessionId,
      templateId
    });

    return () => {
      console.log('[TemplateSelector] Component cleanup for chat:', sessionId);
    };
  }, [sessionId, templateId]);

  const { 
    selectedTemplate, 
    availableTemplates, 
    isLoading, 
    handleTemplateChange 
  } = useTemplateSelection(sessionId, onTemplateChange, globalTemplate);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection requested:', {
      sessionId,
      currentTemplateId: selectedTemplate?.id,
      newTemplateId: template.id,
      templateName: template.name
    });

    if (template.id === selectedTemplate?.id) {
      console.log('[TemplateSelector] Skipping duplicate template selection');
      return;
    }
    
    handleTemplateChange(template);
  }, [handleTemplateChange, sessionId, selectedTemplate?.id]);

  const displayTemplate = useMemo(() => {
    console.log('[TemplateSelector] Display template updated:', {
      sessionId,
      templateId: selectedTemplate?.id,
      templateName: selectedTemplate?.name
    });
    return selectedTemplate;
  }, [selectedTemplate]);

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