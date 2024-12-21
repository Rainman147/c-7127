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
  
  const { 
    selectedTemplate, 
    availableTemplates, 
    isLoading, 
    handleTemplateChange 
  } = useTemplateSelection(currentChatId, onTemplateChange, globalTemplate);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[TemplateSelector] State update:', { 
        currentChatId,
        templateName: selectedTemplate?.name,
        templateId: selectedTemplate?.id,
        isLoading
      });
    }
  }, [currentChatId, selectedTemplate?.id, selectedTemplate?.name, isLoading]);

  const handleTemplateSelect = useCallback((template: Template) => {
    if (template.id === selectedTemplate?.id) {
      console.log('[TemplateSelector] Skipping duplicate template selection');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[TemplateSelector] Template selection:', {
        currentId: selectedTemplate?.id,
        newId: template.id,
        templateName: template.name
      });
    }
    
    setGlobalTemplate(template);
    if (currentChatId) {
      handleTemplateChange(template);
    }
  }, [handleTemplateChange, currentChatId, setGlobalTemplate, selectedTemplate?.id]);

  const displayTemplate = useMemo(() => 
    currentChatId ? selectedTemplate : globalTemplate,
    [currentChatId, selectedTemplate, globalTemplate]
  );

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