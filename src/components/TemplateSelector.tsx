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
import type { Template } from "./template/types";

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

const TemplateSelectorComponent = memo(({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  console.log('[TemplateSelector] Initializing with currentChatId:', currentChatId);
  
  const { globalTemplate, setGlobalTemplate } = useTemplateContext();
  const { selectedTemplate, availableTemplates, isLoading, handleTemplateChange } = useTemplateSelection(
    currentChatId,
    onTemplateChange,
    globalTemplate
  );

  useEffect(() => {
    if (selectedTemplate) {
      console.log('[TemplateSelector] Selected template updated:', selectedTemplate.name);
    }
  }, [selectedTemplate]);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection triggered:', template.name);
    setGlobalTemplate(template);
    if (currentChatId) {
      handleTemplateChange(template);
    }
  }, [handleTemplateChange, currentChatId, setGlobalTemplate]);

  // Use either the chat-specific template or the global template
  const displayTemplate = useMemo(() => 
    currentChatId ? selectedTemplate : globalTemplate
  , [currentChatId, selectedTemplate, globalTemplate]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
        onClick={() => console.log('[TemplateSelector] Dropdown trigger clicked')}
      >
        <span className="whitespace-nowrap">{displayTemplate?.name || 'Select Template'}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="menu-box w-72 max-h-[80vh] overflow-y-auto"
        align="start"
        sideOffset={8}
        onCloseAutoFocus={() => console.log('[TemplateSelector] Dropdown closed')}
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

TemplateSelectorComponent.displayName = 'TemplateSelector';

export const TemplateSelector = TemplateSelectorComponent;