import { Check, Info } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import type { Template } from "./types";

interface TemplateItemProps {
  template: Template;
  isSelected: boolean;
  onSelect: (template: Template) => void;
  isLoading: boolean;
}

export const TemplateItem = ({ 
  template, 
  isSelected, 
  onSelect, 
  isLoading 
}: TemplateItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenuItem
          className={`flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-chatgpt-hover transition-colors ${
            isSelected ? 'bg-chatgpt-secondary' : ''
          }`}
          onClick={() => !isLoading && onSelect(template)}
          disabled={isLoading}
        >
          <span className="flex-1 text-sm font-medium text-white">{template.name}</span>
          <div className="flex items-center gap-2">
            <TooltipTrigger asChild>
              <button 
                className="p-1 rounded-full hover:bg-chatgpt-hover/50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Info className="h-4 w-4 text-gray-400" />
              </button>
            </TooltipTrigger>
            {isSelected && (
              <Check className="h-4 w-4 text-green-500" />
            )}
          </div>
        </DropdownMenuItem>
        <TooltipContent 
          side="right" 
          className="max-w-sm bg-chatgpt-main border border-chatgpt-border p-3 rounded-md shadow-lg"
        >
          <div className="space-y-2">
            <p className="font-medium text-sm text-white">{template.name}</p>
            <p className="text-sm text-gray-300">{template.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};