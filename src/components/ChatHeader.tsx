import { memo, useCallback, useEffect, useMemo } from "react";
import { TemplateSelector } from "./TemplateSelector";
import { ProfileMenu } from "./header/ProfileMenu";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";

interface ChatHeaderProps {
  isSidebarOpen?: boolean;
  currentChatId: string | null;
  onTemplateChange: (template: any) => void;
}

const ChatHeaderComponent = ({ 
  isSidebarOpen = true, 
  currentChatId,
  onTemplateChange 
}: ChatHeaderProps) => {
  const profilePhotoUrl = useProfilePhoto();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ChatHeader] Significant state update:', { 
        isSidebarOpen, 
        currentChatId,
        hasProfilePhoto: !!profilePhotoUrl 
      });
    }
  }, [isSidebarOpen, currentChatId, profilePhotoUrl]);
  
  const handleTemplateChange = useCallback((template: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ChatHeader] Template change:', {
        templateId: template.id,
        templateName: template.name
      });
    }
    onTemplateChange(template);
  }, [onTemplateChange]);

  const templateSelector = useMemo(() => (
    <TemplateSelector 
      key={currentChatId || 'default'}
      currentChatId={currentChatId}
      onTemplateChange={handleTemplateChange}
    />
  ), [currentChatId, handleTemplateChange]);

  const profileMenu = useMemo(() => (
    <ProfileMenu profilePhotoUrl={profilePhotoUrl} />
  ), [profilePhotoUrl]);

  return (
    <div className="fixed top-0 z-30 w-full bg-chatgpt-main/95 backdrop-blur">
      <div className="flex h-[60px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className={`${!isSidebarOpen ? 'ml-24' : ''}`}>
            {templateSelector}
          </span>
        </div>
        {profileMenu}
      </div>
    </div>
  );
};

export const ChatHeader = memo(ChatHeaderComponent);

ChatHeader.displayName = 'ChatHeader';