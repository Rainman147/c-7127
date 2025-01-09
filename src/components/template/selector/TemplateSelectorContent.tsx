import { memo } from "react";
import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { TemplateItem } from "../TemplateItem";
import type { Template } from "@/types/template";

interface TemplateSelectorContentProps {
  templates: Template[];
  selectedTemplate: Template | undefined;
  isLoading: boolean;
  openTooltipId: string | null;
  onTemplateSelect: (template: Template) => void;
  onTooltipChange: (templateId: string | null) => void;
  error?: Error | null; // Added error prop type
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