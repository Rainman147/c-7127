import { memo } from "react";
import { ProfileMenu } from "./header/ProfileMenu";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
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
  const profilePhotoUrl = useProfilePhoto();
  
  return (
    <AppHeader
      variant="chat"
      currentChatId={currentChatId}
      onTemplateChange={onTemplateChange}
      rightContent={<ProfileMenu profilePhotoUrl={profilePhotoUrl} />}
    />
  );
};

export const ChatHeader = memo(ChatHeaderComponent);

ChatHeader.displayName = 'ChatHeader';