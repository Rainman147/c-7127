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
import { validateTemplateId, sanitizeUrlParams } from "@/utils/template/urlParamValidation";
import { getDefaultTemplate } from "@/utils/template/templateStateManager";
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

  // Validate URL parameters on mount and parameter changes
  useEffect(() => {
    const sanitizedParams = sanitizeUrlParams(searchParams);
    const currentParams = new URLSearchParams(searchParams);
    
    // Only update if parameters changed during sanitization
    if (sanitizedParams.toString() !== currentParams.toString()) {
      console.log('[TemplateSelector] Sanitizing invalid URL parameters');
      setSearchParams(sanitizedParams, { replace: true });
    }
    
    const templateId = sanitizedParams.get('templateId');
    const patientId = sanitizedParams.get('patientId');
    
    // Only load template from URL if it's non-default or we have a patient
    if (templateId && (!selectedTemplate || selectedTemplate.id !== templateId)) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        console.log('[TemplateSelector] Loading template from URL:', template.name);
        handleTemplateChange(template);
      }
    }
  }, [searchParams, selectedTemplate, handleTemplateChange, setSearchParams]);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection triggered:', template.name);
    
    if (validateTemplateId(template.id)) {
      // Let parent component handle URL updates
      handleTemplateChange(template);
    } else {
      console.error('[TemplateSelector] Invalid template ID:', template.id);
    }
  }, [handleTemplateChange]);

  const handleTooltipChange = useCallback((templateId: string | null) => {
    console.log('[TemplateSelector] Tooltip state changed for template:', templateId);
    setOpenTooltipId(templateId);
  }, []);

  // Get the display template - either selected or default
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
      <DropdownMenuContent 
        className="w-72 bg-chatgpt-main border border-chatgpt-border rounded-sm shadow-lg z-50"
        align="start"
        onCloseAutoFocus={() => console.log('[TemplateSelector] Dropdown closed')}
      >
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