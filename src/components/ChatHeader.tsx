import { TemplateSelector } from "./TemplateSelector";
import { ModelSelector } from "./chat/ModelSelector";
import { Menu } from "lucide-react";
import type { Template } from "./template/types";
import type { ModelType } from "./chat/ModelSelector";

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
  currentModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

export const ChatHeader = ({ 
  isSidebarOpen, 
  currentChatId,
  onTemplateChange,
  currentModel,
  onModelChange
}: ChatHeaderProps) => {
  return (
    <header className="fixed top-0 z-10 flex w-full items-center justify-between border-b border-white/10 bg-gray-800 px-4 py-2">
      <div className="flex items-center space-x-4">
        {!isSidebarOpen && (
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-300"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
        <TemplateSelector 
          currentChatId={currentChatId} 
          onTemplateChange={onTemplateChange} 
        />
      </div>
      <div className="flex items-center space-x-4">
        <ModelSelector
          currentModel={currentModel}
          onModelChange={onModelChange}
          isDisabled={false}
        />
      </div>
    </header>
  );
};