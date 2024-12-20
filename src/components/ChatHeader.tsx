import { memo } from "react";
import AppHeader from "./layout/AppHeader";

interface ChatHeaderProps {
  isSidebarOpen?: boolean;
  currentChatId: string | null;
  onTemplateChange: (template: any) => void;
}

const ChatHeaderComponent = ({ 
  currentChatId,
  onTemplateChange 
}: ChatHeaderProps) => {
  return (
    <AppHeader
      variant="chat"
      currentChatId={currentChatId}
      onTemplateChange={onTemplateChange}
    />
  );
};

export const ChatHeader = memo(ChatHeaderComponent);

ChatHeader.displayName = 'ChatHeader';