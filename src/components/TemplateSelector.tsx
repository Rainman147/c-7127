import { memo, useCallback, useEffect, useMemo } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TemplateTrigger } from "./template/dropdown/TemplateTrigger";
import { TemplateDropdownContent } from "./template/dropdown/TemplateDropdownContent";
import { useTemplateSelection } from "./template/useTemplateSelection";
import { useTemplateContext } from "@/contexts/TemplateContext";
import type { Template } from "@/components/template/templateTypes";

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  const { globalTemplate, setGlobalTemplate } = useTemplateContext();
  
  useEffect(() => {
    console.log('[TemplateSelector] Component mounted/updated:', {
      currentChatId,
      globalTemplateId: globalTemplate?.id
    });

    return () => {
      console.log('[TemplateSelector] Component cleanup for chat:', currentChatId);
    };
  }, [currentChatId, globalTemplate?.id]);

  const { 
    selectedTemplate, 
    availableTemplates, 
    isLoading, 
    handleTemplateChange 
  } = useTemplateSelection(currentChatId, onTemplateChange, globalTemplate);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection requested:', {
      currentChatId,
      currentTemplateId: selectedTemplate?.id,
      newTemplateId: template.id,
      templateName: template.name
    });

    if (template.id === selectedTemplate?.id) {
      console.log('[TemplateSelector] Skipping duplicate template selection');
      return;
    }
    
    setGlobalTemplate(template);
    if (currentChatId) {
      handleTemplateChange(template);
    }
  }, [handleTemplateChange, currentChatId, setGlobalTemplate, selectedTemplate?.id]);

  const displayTemplate = useMemo(() => {
    const template = currentChatId ? selectedTemplate : globalTemplate;
    console.log('[TemplateSelector] Display template updated:', {
      currentChatId,
      templateId: template?.id,
      templateName: template?.name,
      source: currentChatId ? 'selected' : 'global'
    });
    return template;
  }, [currentChatId, selectedTemplate, globalTemplate]);

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