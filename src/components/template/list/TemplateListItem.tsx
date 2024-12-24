import { Button } from "@/components/ui/button";
import { Info, Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TemplateListItemProps {
  template: {
    id: string;
    name: string;
    instructions?: {
      dataFormatting?: string;
      priorityRules?: string;
      specialConditions?: string;
    };
  };
  onEdit: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}

export const TemplateListItem = ({ template, onEdit, onDelete }: TemplateListItemProps) => {
  return (
    <div className="menu-box p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-medium">{template.name}</span>
        <TooltipProvider>
          <Tooltip content={
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
          }>
            <Button variant="ghost" size="icon">
              <Info className="h-4 w-4" />
            </Button>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(template.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(template.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};