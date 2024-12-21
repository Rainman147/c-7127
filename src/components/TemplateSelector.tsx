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

  // Memoize logging effect
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[TemplateSelector] Chat ID or template changed:', { 
        currentChatId,
        templateName: selectedTemplate?.name,
        templateId: selectedTemplate?.id
      });
    }
  }, [currentChatId, selectedTemplate?.id, selectedTemplate?.name]);

  // Memoize template selection handler
  const handleTemplateSelect = useCallback((template: Template) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[TemplateSelector] Template selection requested:', {
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

  // Memoize display template
  const displayTemplate = useMemo(() => 
    currentChatId ? selectedTemplate : globalTemplate,
    [currentChatId, selectedTemplate, globalTemplate]
  );

  // Memoize dropdown trigger content
  const triggerContent = useMemo(() => (
    <>
      <span className="whitespace-nowrap">{displayTemplate?.name || 'Select Template'}</span>
      <ChevronDown className="h-4 w-4 opacity-70" />
    </>
  ), [displayTemplate?.name]);

  // Memoize dropdown content
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