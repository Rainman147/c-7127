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
import { getDefaultTemplate } from "@/utils/template/templateStateManager";
import { useUrlStateManager } from "@/hooks/useUrlStateManager";
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

  const { handleTemplateChange: updateUrlTemplate } = useUrlStateManager(currentChatId);
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection triggered:', template.name);
    handleTemplateChange(template);
    updateUrlTemplate(template);
  }, [handleTemplateChange, updateUrlTemplate]);

  const handleTooltipChange = useCallback((templateId: string | null) => {
    console.log('[TemplateSelector] Tooltip state changed for template:', templateId);
    setOpenTooltipId(templateId);
  }, []);

  const displayTemplate = selectedTemplate || getDefaultTemplate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
        onClick={() => console.log('[TemplateSelector] Dropdown trigger clicked')}
      >
        <span className="whitespace-nowrap">{displayTemplate.name}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {templates.map((template) => (
          <TemplateItem
            key={template.id}
            template={template}
            isSelected={displayTemplate.id === template.id}
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