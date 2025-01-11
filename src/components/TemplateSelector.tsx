import { memo, useCallback, useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { useSearchParams } from "react-router-dom";
import { useTemplateQuery, useTemplatesListQuery, useTemplateRefresh } from "@/hooks/queries/useTemplateQueries";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelectorTrigger } from "./template/selector/TemplateSelectorTrigger";
import { TemplateSelectorContent } from "./template/selector/TemplateSelectorContent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Template } from "@/types/template";
import { isValidTemplate } from "@/types/template/guards";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTemplateId = searchParams.get('templateId');
  const { toast } = useToast();
  const { refreshTemplate, refreshAllTemplates } = useTemplateRefresh();
  
  console.log('[TemplateSelector] Initializing with:', { 
    currentChatId, 
    initialTemplateId 
  });
  
  // Query for all templates with better error handling
  const { 
    data: templates = [], 
    isLoading: isLoadingTemplates, 
    error: templatesError,
    isError: isTemplatesError,
    refetch: refetchTemplates
  } = useTemplatesListQuery();
  
  // Query for selected template with better error handling
  const { 
    data: selectedTemplate, 
    isLoading: isLoadingTemplate, 
    error: templateError,
    isError: isTemplateError,
    refetch: refetchTemplate
  } = useTemplateQuery(initialTemplateId);
  
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  const handleTemplateSelect = useCallback(async (template: Template) => {
    console.log('[TemplateSelector] Template selection triggered:', template.name);
    
    if (!isValidTemplate(template)) {
      console.error('[TemplateSelector] Invalid template selected:', template);
      toast({
        title: "Invalid Template",
        description: "The selected template is invalid. Please try another one.",
        variant: "destructive",
      });
      return;
    }
    
    try {
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
      
      console.log('[TemplateSelector] Template selection successful:', template.name);
    } catch (error) {
      console.error('[TemplateSelector] Error during template selection:', error);
      toast({
        title: "Template Selection Failed",
        description: "There was an error selecting the template. Please try again.",
        variant: "destructive",
      });
      
      // Attempt to recover by refetching data
      refetchTemplates();
      if (initialTemplateId) {
        refetchTemplate();
      }
    }
  }, [searchParams, setSearchParams, onTemplateChange, toast, refetchTemplates, refetchTemplate, initialTemplateId]);

  const handleTooltipChange = useCallback((templateId: string | null) => {
    console.log('[TemplateSelector] Tooltip state changed for template:', templateId);
    setOpenTooltipId(templateId);
  }, []);

  const handleRefresh = useCallback(async () => {
    console.log('[TemplateSelector] Manual refresh triggered');
    if (initialTemplateId) {
      await refreshTemplate(initialTemplateId);
    }
    await refreshAllTemplates();
    toast({
      title: "Templates Refreshed",
      description: "Template list has been updated.",
    });
  }, [initialTemplateId, refreshTemplate, refreshAllTemplates, toast]);

  // Handle critical errors that prevent template selection
  if (isTemplatesError && templatesError) {
    console.error('[TemplateSelector] Critical error loading templates:', templatesError);
    return (
      <Alert variant="destructive" className="w-[260px]">
        <AlertDescription>
          Unable to load templates. Please refresh the page or try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const isLoading = isLoadingTemplates || isLoadingTemplate;
  const hasError = isTemplatesError || isTemplateError;
  const error = templatesError || templateError;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <TemplateSelectorTrigger 
          selectedTemplate={selectedTemplate}
          isLoading={isLoading}
          hasError={hasError}
        />
        <TemplateSelectorContent
          templates={templates}
          selectedTemplate={selectedTemplate}
          isLoading={isLoading}
          openTooltipId={openTooltipId}
          onTemplateSelect={handleTemplateSelect}
          onTooltipChange={handleTooltipChange}
          error={error}
        />
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        className="h-8 w-8"
        title="Refresh templates"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
});

TemplateSelector.displayName = 'TemplateSelector';