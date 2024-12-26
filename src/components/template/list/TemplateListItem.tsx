import { Button } from "@/components/ui/button";
import { Info, Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Template } from "../templateTypes";

interface TemplateListItemProps {
  template: Template;
  onEdit: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onSelect?: () => void;
}

export const TemplateListItem = ({ template, onEdit, onDelete, onSelect }: TemplateListItemProps) => {
  return (
    <div 
      className="menu-box p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100/5"
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{template.name}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-2">
                <p className="font-medium">Instructions:</p>
                {template.instructions && (
                  <div className="text-sm">
                    <p>Formatting: {template.instructions.dataFormatting}</p>
                    <p>Priority Rules: {template.instructions.priorityRules}</p>
                    <p>Special Conditions: {template.instructions.specialConditions}</p>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(template.id);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(template.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};