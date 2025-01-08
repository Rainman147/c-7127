import { memo, useCallback, useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { useSearchParams } from "react-router-dom";
import { useTemplateQuery, useTemplatesListQuery } from "@/hooks/queries/useTemplateQueries";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelectorTrigger } from "./template/selector/TemplateSelectorTrigger";
import { TemplateSelectorContent } from "./template/selector/TemplateSelectorContent";
import type { Template } from "@/types/template";
import { isValidTemplate } from "@/types/template";

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
  const { data: templates = [], isLoading: isLoadingTemplates, error: templatesError } = useTemplatesListQuery();
  
  // Query for selected template
  const { data: selectedTemplate, isLoading: isLoadingTemplate, error: templateError } = useTemplateQuery(initialTemplateId);
  
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  const handleTemplateSelect = useCallback((template: Template) => {
    console.log('[TemplateSelector] Template selection triggered:', template.name);
    
    if (!isValidTemplate(template)) {
      toast({
        title: "Invalid Template",
        description: "The selected template is invalid. Please try another one.",
        variant: "destructive",
      });
      return;
    }
    
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
  }, [searchParams, setSearchParams, onTemplateChange, toast]);

  const handleTooltipChange = useCallback((templateId: string | null) => {
    console.log('[TemplateSelector] Tooltip state changed for template:', templateId);
    setOpenTooltipId(templateId);
  }, []);

  // Handle errors
  if (templatesError || templateError) {
    toast({
      title: "Error Loading Templates",
      description: "There was an error loading the templates. Please try again.",
      variant: "destructive",
    });
  }

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