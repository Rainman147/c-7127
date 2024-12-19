import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Template } from "./types";

interface TemplateItemProps {
  template: Template;
  isSelected: boolean;
  onSelect: (template: Template) => void;
  isLoading: boolean;
  isTooltipOpen: boolean;
  onTooltipChange: (isOpen: boolean) => void;
}

export const TemplateItem = ({ 
  template, 
  isSelected, 
  onSelect, 
  isLoading
}: TemplateItemProps) => {
  return (
    <DropdownMenuItem
      className={`menu-item ${isSelected ? 'menu-item-active' : ''}`}
      onClick={() => !isLoading && onSelect(template)}
      disabled={isLoading}
    >
      <span className="text-sm font-medium text-white">{template.name}</span>
      <span className="text-xs text-gray-400 mt-1">
        {template.description.split('.')[0].trim()}
      </span>
    </DropdownMenuItem>
  );
};