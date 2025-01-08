import { memo, useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateItem } from "./template/TemplateItem";
import { useTemplateSelection } from "./template/useTemplateSelection";
import { templates } from "./template/types";
import { useSearchParams } from "react-router-dom";
import type { Template } from "./template/types";

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTemplateId = searchParams.get('templateId');
  
  console.log('[TemplateSelector] Initializing with:', { 
    currentChatId, 
    initialTemplateId 
  });
  
  const { selectedTemplate, isLoading, handleTemplateChange } = useTemplateSelection(
    currentChatId,
    onTemplateChange,
    initialTemplateId
  );

  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection triggered:', template.name);
    
    // Update URL first
    const params = new URLSearchParams(searchParams);
    if (template.id === templates[0].id) {
      params.delete('templateId');
    } else {
      params.set('templateId', template.id);
    }
    setSearchParams(params, { replace: true });
    
    // Then update template state
    handleTemplateChange(template);
  }, [handleTemplateChange, searchParams, setSearchParams]);

  const handleTooltipChange = useCallback((templateId: string | null) => {
    console.log('[TemplateSelector] Tooltip state changed for template:', templateId);
    setOpenTooltipId(templateId);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        <span className="whitespace-nowrap">{selectedTemplate.name}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {templates.map((template) => (
          <TemplateItem
            key={template.id}
            template={template}
            isSelected={selectedTemplate.id === template.id}
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