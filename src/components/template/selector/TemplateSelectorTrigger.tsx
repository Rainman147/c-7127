import { memo } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Template } from "@/types/template";

interface TemplateSelectorTriggerProps {
  selectedTemplate: Template | undefined;
  isLoading: boolean;
  hasError?: boolean;
}

export const TemplateSelectorTrigger = memo(({ 
  selectedTemplate, 
  isLoading,
  hasError 
}: TemplateSelectorTriggerProps) => {
  if (isLoading) {
    return (
      <DropdownMenuTrigger asChild aria-label="Select template" disabled>
        <div className="flex items-center gap-2 text-sm font-medium text-white opacity-50">
          <span className="whitespace-nowrap">Loading templates...</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </div>
      </DropdownMenuTrigger>
    );
  }

  if (hasError) {
    return (
      <DropdownMenuTrigger asChild aria-label="Template error" disabled>
        <div className="flex items-center gap-2 text-sm font-medium text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span className="whitespace-nowrap">Error loading templates</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </div>
      </DropdownMenuTrigger>
    );
  }

  return (
    <DropdownMenuTrigger 
      asChild 
      aria-label="Select template"
      aria-expanded="false"
      aria-haspopup="menu"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors cursor-pointer">
        <span className="whitespace-nowrap">{selectedTemplate?.name || 'Select Template'}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </div>
    </DropdownMenuTrigger>
  );
});

TemplateSelectorTrigger.displayName = 'TemplateSelectorTrigger';