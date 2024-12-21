import { memo, useCallback, useEffect, useMemo } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TemplateTrigger } from "./template/dropdown/TemplateTrigger";
import { TemplateDropdownContent } from "./template/dropdown/TemplateDropdownContent";
import { useTemplateSelection } from "./template/useTemplateSelection";
import { useTemplateContext } from "@/contexts/TemplateContext";
import { useSessionParams } from "@/hooks/routing/useSessionParams";
import type { Template } from "@/components/template/templateTypes";

interface TemplateSelectorProps {
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ onTemplateChange }: TemplateSelectorProps) => {
  const { globalTemplate, setGlobalTemplate } = useTemplateContext();
  const { sessionId } = useSessionParams();
  
  useEffect(() => {
    console.log('[TemplateSelector] Component mounted/updated:', {
      sessionId,
      globalTemplateId: globalTemplate?.id
    });

    return () => {
      console.log('[TemplateSelector] Component cleanup for chat:', sessionId);
    };
  }, [sessionId, globalTemplate?.id]);

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
    
    setGlobalTemplate(template);
    handleTemplateChange(template);
  }, [handleTemplateChange, sessionId, setGlobalTemplate, selectedTemplate?.id]);

  const displayTemplate = useMemo(() => {
    const template = sessionId ? selectedTemplate : globalTemplate;
    console.log('[TemplateSelector] Display template updated:', {
      sessionId,
      templateId: template?.id,
      templateName: template?.name,
      source: sessionId ? 'selected' : 'global'
    });
    return template;
  }, [sessionId, selectedTemplate, globalTemplate]);

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