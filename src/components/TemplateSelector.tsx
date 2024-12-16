import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateItem } from "./template/TemplateItem";
import { useTemplateSelection } from "./template/useTemplateSelection";
import { templates } from "./template/types";
import type { Template } from "./template/types";

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

const TemplateSelector = ({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  const { selectedTemplate, isLoading, handleTemplateChange } = useTemplateSelection(
    currentChatId,
    onTemplateChange
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 px-3 py-1 font-semibold text-sm hover:bg-gray-700/50 rounded-md transition-colors disabled:opacity-50"
        disabled={isLoading}
      >
        {selectedTemplate.name}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 bg-gray-800 border border-gray-700 rounded-md shadow-lg"
        align="start"
      >
        {templates.map((template) => (
          <TemplateItem
            key={template.id}
            template={template}
            isSelected={selectedTemplate.id === template.id}
            onSelect={handleTemplateChange}
            isLoading={isLoading}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TemplateSelector;