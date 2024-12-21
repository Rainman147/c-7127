import { memo } from "react";
import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { TemplateItem } from "../TemplateItem";
import type { Template } from "@/components/template/templateTypes";

interface TemplateDropdownContentProps {
  templates: Template[];
  selectedTemplateId: string | undefined;
  onTemplateSelect: (template: Template) => void;
  isLoading: boolean;
}

export const TemplateDropdownContent = memo(({ 
  templates,
  selectedTemplateId,
  onTemplateSelect,
  isLoading
}: TemplateDropdownContentProps) => {
  return (
    <DropdownMenuContent 
      className="menu-box w-72 max-h-[80vh] overflow-y-auto"
      align="start"
      sideOffset={8}
    >
      {templates.map((template) => (
        <TemplateItem
          key={template.id}
          template={template}
          isSelected={selectedTemplateId === template.id}
          onSelect={onTemplateSelect}
          isLoading={isLoading}
          isTooltipOpen={false}
          onTooltipChange={() => {}}
        />
      ))}
    </DropdownMenuContent>
  );
});

TemplateDropdownContent.displayName = 'TemplateDropdownContent';