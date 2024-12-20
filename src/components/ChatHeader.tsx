import { memo } from "react";
import { TemplateSelector } from "./TemplateSelector";
import { ProfileMenu } from "./header/ProfileMenu";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useSidebar } from "@/contexts/SidebarContext";
import type { Template } from '@/components/template/types';

interface ChatHeaderProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

const ChatHeaderComponent = ({ 
  currentChatId,
  onTemplateChange 
}: ChatHeaderProps) => {
  const profilePhotoUrl = useProfilePhoto();
  const { isSidebarOpen } = useSidebar();
  
  console.log('[ChatHeader] Rendering with:', { 
    isSidebarOpen, 
    currentChatId,
    hasTemplateChangeHandler: !!onTemplateChange,
    profilePhotoUrl 
  });
  
  const handleTemplateChange = (template: Template) => {
    console.log('[ChatHeader] Template change requested:', template);
    onTemplateChange(template);
  };

  return (
    <div className="fixed top-0 z-30 w-full border-b border-white/20 bg-chatgpt-main/95 backdrop-blur">
      <div className="flex h-[60px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className={`${!isSidebarOpen ? 'ml-24' : ''}`}>
            <TemplateSelector 
              key={currentChatId || 'default'}
              currentChatId={currentChatId}
              onTemplateChange={handleTemplateChange}
            />
          </span>
        </div>
        
        <ProfileMenu profilePhotoUrl={profilePhotoUrl} />
      </div>
    </div>
  );
};

export const ChatHeader = memo(ChatHeaderComponent);

ChatHeader.displayName = 'ChatHeader';