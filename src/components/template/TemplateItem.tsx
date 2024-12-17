import { Info } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { getDeviceType } from "@/utils/deviceDetection";
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
  isLoading,
  isTooltipOpen,
  onTooltipChange
}: TemplateItemProps) => {
  const { isIOS } = getDeviceType();

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[TemplateItem] Info button clicked for:', template.name);
    if (isIOS) {
      onTooltipChange(!isTooltipOpen);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip 
        open={isIOS ? isTooltipOpen : undefined}
        onOpenChange={onTooltipChange}
      >
        <DropdownMenuItem
          className={`flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-chatgpt-hover transition-colors rounded-[2px] ${
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
                onClick={handleInfoClick}
              >
                <Info className="h-4 w-4 text-gray-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              className="w-[280px] max-w-[80vw] bg-chatgpt-main border border-chatgpt-border p-2.5 rounded-[2px] shadow-lg"
              sideOffset={5}
              align="center"
              onPointerDownOutside={() => isIOS && onTooltipChange(false)}
            >
              <div className="space-y-1.5">
                <p className="font-medium text-sm text-white">{template.name}</p>
                <p className="text-xs text-gray-300 leading-relaxed">{template.description}</p>
              </div>
            </TooltipContent>
          </div>
        </DropdownMenuItem>
      </Tooltip>
    </TooltipProvider>
  );
};