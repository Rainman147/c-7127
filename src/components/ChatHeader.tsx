import { memo, useCallback, useEffect } from "react";
import { TemplateSelector } from "./TemplateSelector";
import { ProfileMenu } from "./header/ProfileMenu";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useSessionParams } from "@/hooks/routing/useSessionParams";
import { useSessionCoordinator } from "@/hooks/chat/useSessionCoordinator";
import type { Template } from "./template/templateTypes";

interface ChatHeaderProps {
  isSidebarOpen?: boolean;
}

const ChatHeaderComponent = ({ 
  isSidebarOpen = true,
}: ChatHeaderProps) => {
  const profilePhotoUrl = useProfilePhoto();
  const { sessionId, templateId } = useSessionParams();
  const { handleTemplateChange: coordinateTemplateChange } = useSessionCoordinator();
  
  useEffect(() => {
    console.log('[ChatHeader] Component mounted/updated:', { 
      isSidebarOpen, 
      sessionId,
      templateId,
      hasProfilePhoto: !!profilePhotoUrl 
    });

    return () => {
      console.log('[ChatHeader] Component cleanup for chat:', sessionId);
    };
  }, [isSidebarOpen, sessionId, templateId, profilePhotoUrl]);
  
  const handleTemplateChange = useCallback((template: Template) => {
    console.log('[ChatHeader] Template change requested:', {
      sessionId,
      templateId: template.id,
      templateName: template.name
    });
    coordinateTemplateChange(template, sessionId);
  }, [coordinateTemplateChange, sessionId]);

  return (
    <div className="fixed top-0 z-30 w-full bg-chatgpt-main/95 backdrop-blur">
      <div className="max-w-3xl mx-auto">
        <div className="flex h-[60px] items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className={`${!isSidebarOpen ? 'ml-16' : ''} transition-all duration-300`}>
              <TemplateSelector 
                onTemplateChange={handleTemplateChange}
              />
            </span>
          </div>
          <ProfileMenu profilePhotoUrl={profilePhotoUrl} />
        </div>
      </div>
    </div>
  );
};

export const ChatHeader = memo(ChatHeaderComponent);

ChatHeader.displayName = 'ChatHeader';