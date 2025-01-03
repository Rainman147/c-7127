import { memo, useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  console.log('[TemplateSelector] Initializing with currentChatId:', currentChatId);
  console.log('[TemplateSelector] URL template parameter:', searchParams.get('templateId'));
  
  const { selectedTemplate, isLoading, handleTemplateChange } = useTemplateSelection(
    currentChatId,
    onTemplateChange
  );

  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  // Sync URL parameters with template selection
  useEffect(() => {
    const templateId = searchParams.get('templateId');
    if (templateId && (!selectedTemplate || selectedTemplate.id !== templateId)) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        console.log('[TemplateSelector] Loading template from URL:', template.name);
        handleTemplateChange(template);
      }
    }
  }, [searchParams, selectedTemplate, handleTemplateChange]);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection triggered:', template.name);
    
    // Update URL parameters
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('templateId', template.id);
      return newParams;
    }, { replace: true });
    
    handleTemplateChange(template);
  }, [handleTemplateChange, setSearchParams]);

  const handleTooltipChange = useCallback((templateId: string | null) => {
    console.log('[TemplateSelector] Tooltip state changed for template:', templateId);
    setOpenTooltipId(templateId);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
        onClick={() => console.log('[TemplateSelector] Dropdown trigger clicked')}
      >
        <span className="whitespace-nowrap">{selectedTemplate?.name || 'Live Patient Session'}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 bg-chatgpt-main border border-chatgpt-border rounded-sm shadow-lg z-50"
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
            isTooltipOpen={openTooltipId === template.id}
            onTooltipChange={(isOpen) => handleTooltipChange(isOpen ? template.id : null)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

TemplateSelector.displayName = 'TemplateSelector';