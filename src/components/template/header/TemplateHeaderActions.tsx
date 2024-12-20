import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TemplateHeaderActionsProps {
  onNewTemplate: () => void;
}

export const TemplateHeaderActions = ({ onNewTemplate }: TemplateHeaderActionsProps) => {
  return (
    <div className="flex justify-end">
      <Button 
        className="flex items-center gap-2"
        onClick={onNewTemplate}
      >
        <Plus className="h-4 w-4" />
        New Template
      </Button>
    </div>
  );
};