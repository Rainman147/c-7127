import { memo } from "react";
import { AlertCircle } from "lucide-react";
import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TemplateItem } from "../TemplateItem";
import type { Template } from "@/types/template";

interface TemplateSelectorContentProps {
  templates: Template[];
  selectedTemplate: Template | undefined;
  isLoading: boolean;
  openTooltipId: string | null;
  onTemplateSelect: (template: Template) => void;
  onTooltipChange: (templateId: string | null) => void;
  error?: Error | null;
}

export const TemplateSelectorContent = memo(({ 
  templates,
  selectedTemplate,
  isLoading,
  openTooltipId,
  onTemplateSelect,
  onTooltipChange,
  error
}: TemplateSelectorContentProps) => {
  console.log('[TemplateSelectorContent] Rendering with templates:', templates.length, error ? 'Error present' : 'No error');
  
  if (error) {
    return (
      <DropdownMenuContent align="start" className="p-2">
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error.message || 'Failed to load templates'}
          </AlertDescription>
        </Alert>
      </DropdownMenuContent>
    );
  }

  if (isLoading) {
    return (
      <DropdownMenuContent align="start" className="p-2">
        <div className="flex items-center justify-center py-2 text-sm text-gray-400">
          Loading templates...
        </div>
      </DropdownMenuContent>
    );
  }

  if (templates.length === 0) {
    return (
      <DropdownMenuContent align="start" className="p-2">
        <div className="flex items-center justify-center py-2 text-sm text-gray-400">
          No templates available
        </div>
      </DropdownMenuContent>
    );
  }

  return (
    <DropdownMenuContent align="start">
      {templates.map((template) => (
        <TemplateItem
          key={template.id}
          template={template}
          isSelected={selectedTemplate?.id === template.id}
          onSelect={onTemplateSelect}
          isLoading={isLoading}
          isTooltipOpen={openTooltipId === template.id}
          onTooltipChange={(isOpen) => onTooltipChange(isOpen ? template.id : null)}
        />
      ))}
    </DropdownMenuContent>
  );
});

TemplateSelectorContent.displayName = 'TemplateSelectorContent';