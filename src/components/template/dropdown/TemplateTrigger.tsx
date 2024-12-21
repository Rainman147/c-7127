import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Template } from "@/components/template/templateTypes";

interface TemplateTriggerProps {
  displayTemplate: Template | null;
  isLoading: boolean;
}

export const TemplateTrigger = memo(({ displayTemplate, isLoading }: TemplateTriggerProps) => {
  return (
    <DropdownMenuTrigger 
      className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isLoading}
    >
      <span className="whitespace-nowrap">{displayTemplate?.name || 'Select Template'}</span>
      <ChevronDown className="h-4 w-4 opacity-70" />
    </DropdownMenuTrigger>
  );
});

TemplateTrigger.displayName = 'TemplateTrigger';