import { memo } from 'react';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Template } from "./templateTypes";

interface TemplateItemProps {
  template: Template;
  isSelected: boolean;
  onSelect: (template: Template) => void;
  isLoading: boolean;
  isTooltipOpen: boolean;
  onTooltipChange: (isOpen: boolean) => void;
}

export const TemplateItem = memo(({ 
  template, 
  isSelected, 
  onSelect, 
  isLoading
}: TemplateItemProps) => {
  const handleClick = () => {
    if (!isLoading) {
      onSelect(template);
    }
  };

  return (
    <DropdownMenuItem
      className={`flex flex-col items-start px-3 py-2.5 cursor-pointer hover:bg-chatgpt-hover transition-colors rounded-[2px] ${
        isSelected ? 'bg-chatgpt-secondary' : ''
      }`}
      onClick={handleClick}
      disabled={isLoading}
    >
      <span className="text-sm font-medium text-white">{template.name}</span>
      <span className="text-xs text-gray-400 mt-1">
        {(template.content || template.description).split('.')[0].trim()}
      </span>
    </DropdownMenuItem>
  );
});

TemplateItem.displayName = 'TemplateItem';