import { memo, useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateItem } from "./template/TemplateItem";
import { useSearchParams } from "react-router-dom";
import { useTemplateQuery, useTemplatesListQuery } from "@/hooks/queries/useTemplateQueries";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "./template/types";

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTemplateId = searchParams.get('templateId');
  const { toast } = useToast();
  
  console.log('[TemplateSelector] Initializing with:', { 
    currentChatId, 
    initialTemplateId 
  });
  
  // Query for all templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useTemplatesListQuery();
  
  // Query for selected template
  const { data: selectedTemplate, isLoading: isLoadingTemplate } = useTemplateQuery(initialTemplateId);
  
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection triggered:', template.name);
    
    // Update URL first
    const params = new URLSearchParams(searchParams);
    if (template.id === 'live-session') {
      params.delete('templateId');
    } else {
      params.set('templateId', template.id);
    }
    setSearchParams(params, { replace: true });
    
    // Then update parent component
    onTemplateChange(template);
  }, [searchParams, setSearchParams, onTemplateChange]);

  const handleTooltipChange = useCallback((templateId: string | null) => {
    console.log('[TemplateSelector] Tooltip state changed for template:', templateId);
    setOpenTooltipId(templateId);
  }, []);

  const isLoading = isLoadingTemplates || isLoadingTemplate;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-white opacity-50">
        <span className="whitespace-nowrap">Loading templates...</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors"
      >
        <span className="whitespace-nowrap">{selectedTemplate?.name || 'Select Template'}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
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