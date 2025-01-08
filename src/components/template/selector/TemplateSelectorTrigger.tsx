import { memo } from "react";
import { ChevronDown } from "lucide-react";
import type { Template } from "../types";

interface TemplateSelectorTriggerProps {
  selectedTemplate: Template | undefined;
  isLoading: boolean;
}

export const TemplateSelectorTrigger = memo(({ selectedTemplate, isLoading }: TemplateSelectorTriggerProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-white opacity-50">
        <span className="whitespace-nowrap">Loading templates...</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors">
      <span className="whitespace-nowrap">{selectedTemplate?.name || 'Select Template'}</span>
      <ChevronDown className="h-4 w-4 opacity-70" />
    </div>
  );
});

TemplateSelectorTrigger.displayName = 'TemplateSelectorTrigger';