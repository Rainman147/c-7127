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
import type { Template } from "@/types/templates/base";

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  const { globalTemplate, setGlobalTemplate } = useTemplateContext();
  
  // Memoize template selection hook results
  const { 
    selectedTemplate, 
    availableTemplates, 
    isLoading, 
    handleTemplateChange 
  } = useTemplateSelection(currentChatId, onTemplateChange, globalTemplate);

  // Log only on mount or when currentChatId changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[TemplateSelector] Chat ID changed:', { 
        currentChatId,
        hasTemplate: !!selectedTemplate,
        templateName: selectedTemplate?.name
      });
    }
  }, [currentChatId, selectedTemplate?.name]);

  const handleTemplateSelect = useCallback((template: Template) => {
    if (process.env.NODE_ENV === 'development' && template.id !== selectedTemplate?.id) {
      console.log('[TemplateSelector] Template selected:', template.name);
    }
    setGlobalTemplate(template);
    if (currentChatId) {
      handleTemplateChange(template);
    }
  }, [handleTemplateChange, currentChatId, setGlobalTemplate, selectedTemplate?.id]);

  // Memoize the display template
  const displayTemplate = useMemo(() => 
    currentChatId ? selectedTemplate : globalTemplate,
    [currentChatId, selectedTemplate, globalTemplate]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        <span className="whitespace-nowrap">{displayTemplate?.name || 'Select Template'}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="menu-box w-72 max-h-[80vh] overflow-y-auto"
        align="start"
        sideOffset={8}
      >
        {availableTemplates.map((template) => (
          <TemplateItem
            key={template.id}
            template={template}
            isSelected={displayTemplate?.id === template.id}
            onSelect={handleTemplateSelect}
            isLoading={isLoading}
            isTooltipOpen={false}
            onTooltipChange={() => {}}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

TemplateSelector.displayName = 'TemplateSelector';
