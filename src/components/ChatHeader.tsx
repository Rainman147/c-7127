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
    console.log('[ChatHeader] Component mounted/updated:', { 
      isSidebarOpen, 
      currentChatId,
      hasProfilePhoto: !!profilePhotoUrl 
    });

    return () => {
      console.log('[ChatHeader] Component cleanup for chat:', currentChatId);
    };
  }, [isSidebarOpen, currentChatId, profilePhotoUrl]);
  
  const handleTemplateChange = useCallback((template: any) => {
    console.log('[ChatHeader] Template change requested:', {
      chatId: currentChatId,
      templateId: template.id,
      templateName: template.name
    });
    onTemplateChange(template);
  }, [onTemplateChange, currentChatId]);

  const templateSelector = useMemo(() => {
    console.log('[ChatHeader] Creating TemplateSelector instance for chat:', currentChatId);
    return (
      <TemplateSelector 
        key={currentChatId || 'default'}
        currentChatId={currentChatId}
        onTemplateChange={handleTemplateChange}
      />
    );
  }, [currentChatId, handleTemplateChange]);

  const profileMenu = useMemo(() => {
    console.log('[ChatHeader] Creating ProfileMenu instance');
    return <ProfileMenu profilePhotoUrl={profilePhotoUrl} />;
  }, [profilePhotoUrl]);

  return (
    <div className="fixed top-0 z-30 w-full bg-chatgpt-main/95 backdrop-blur">
      <div className="max-w-3xl mx-auto">
        <div className="flex h-[60px] items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className={`${!isSidebarOpen ? 'ml-16' : ''} transition-all duration-300`}>
              {templateSelector}
            </span>
          </div>
          {profileMenu}
        </div>
      </div>
    </div>
  );
};

export const ChatHeader = memo(ChatHeaderComponent);

ChatHeader.displayName = 'ChatHeader';