import { memo, useCallback, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateItem } from "./template/TemplateItem";
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

  const triggerContent = useMemo(() => (
    <>
      <span className="whitespace-nowrap">{displayTemplate?.name || 'Select Template'}</span>
      <ChevronDown className="h-4 w-4 opacity-70" />
    </>
  ), [displayTemplate?.name]);

  const dropdownContent = useMemo(() => (
    availableTemplates.map((template) => (
      <TemplateItem
        key={template.id}
        template={template}
        isSelected={displayTemplate?.id === template.id}
        onSelect={handleTemplateSelect}
        isLoading={isLoading}
        isTooltipOpen={false}
        onTooltipChange={() => {}}
      />
    ))
  ), [availableTemplates, displayTemplate?.id, handleTemplateSelect, isLoading]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {triggerContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="menu-box w-72 max-h-[80vh] overflow-y-auto"
        align="start"
        sideOffset={8}
      >
        {dropdownContent}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

TemplateSelector.displayName = 'TemplateSelector';