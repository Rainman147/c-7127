import { memo, useCallback, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateItem } from "./template/TemplateItem";
import { useTemplateSelection } from "./template/useTemplateSelection";
import { templates } from "./template/types";
import type { Template } from "./template/types";

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  console.log('[TemplateSelector] Initializing with currentChatId:', currentChatId);
  
  const { selectedTemplate, isLoading, handleTemplateChange } = useTemplateSelection(
    currentChatId,
    onTemplateChange
  );

  useEffect(() => {
    console.log('[TemplateSelector] Selected template updated:', selectedTemplate?.name);
  }, [selectedTemplate]);

  useEffect(() => {
    console.log('[TemplateSelector] Loading state changed:', isLoading);
  }, [isLoading]);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection triggered:', template.name);
    handleTemplateChange(template);
  }, [handleTemplateChange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-chatgpt-secondary hover:bg-chatgpt-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-chatgpt-border/50"
        disabled={isLoading}
        onClick={() => console.log('[TemplateSelector] Dropdown trigger clicked')}
      >
        <span className="whitespace-nowrap">{selectedTemplate?.name || 'Live Patient Session'}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 bg-chatgpt-main border border-chatgpt-border rounded-md shadow-lg z-50"
        align="start"
        onCloseAutoFocus={() => console.log('[TemplateSelector] Dropdown closed')}
      >
        {templates.map((template) => (
          <TemplateItem
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            onSelect={handleTemplateSelect}
            isLoading={isLoading}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

TemplateSelector.displayName = 'TemplateSelector';