import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";
import TemplateSelector from "./TemplateSelector";
import { ProfileMenu } from "./header/ProfileMenu";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  currentChatId?: string;
  onTemplateChange?: (template: any) => void;
}

export function ChatHeader({ currentChatId, onTemplateChange }: ChatHeaderProps) {
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen } = useSidebar();
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    if (currentChatId) {
      // Load template data if needed
      console.log('[ChatHeader] Current chat ID:', currentChatId);
    }
  }, [currentChatId]);

  const handleTemplateChange = (template: any) => {
    setSelectedTemplate(template);
    if (onTemplateChange) {
      onTemplateChange(template);
    }
    
    if (template?.id && currentChatId) {
      console.log('[ChatHeader] Template changed:', template);
      navigate(`/chat/${currentChatId}?template=${template.id}`);
    }
  };

  const templateSelector = (
    <TemplateSelector
      value={selectedTemplate}
      onValueChange={handleTemplateChange}
    />
  );

  const profileMenu = <ProfileMenu />;

  return (
    <div className="fixed top-0 z-30 w-full bg-chatgpt-main/95 backdrop-blur">
      <div className="max-w-3xl mx-auto">
        <div className="flex h-[60px] items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className={cn(
              "transition-all duration-300",
              !isSidebarOpen ? "ml-16" : ""
            )}>
              {templateSelector}
            </span>
          </div>
          {profileMenu}
        </div>
      </div>
    </div>
  );
}