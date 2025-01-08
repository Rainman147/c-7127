import { memo, useCallback, useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { useSearchParams } from "react-router-dom";
import { useTemplateQuery, useTemplatesListQuery } from "@/hooks/queries/useTemplateQueries";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelectorTrigger } from "./template/selector/TemplateSelectorTrigger";
import { TemplateSelectorContent } from "./template/selector/TemplateSelectorContent";
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

  return (
    <DropdownMenu>
      <TemplateSelectorTrigger 
        selectedTemplate={selectedTemplate}
        isLoading={isLoading}
      />
      <TemplateSelectorContent
        templates={templates}
        selectedTemplate={selectedTemplate}
        isLoading={isLoading}
        openTooltipId={openTooltipId}
        onTemplateSelect={handleTemplateSelect}
        onTooltipChange={handleTooltipChange}
      />
    </DropdownMenu>
  );
});

TemplateSelector.displayName = 'TemplateSelector';