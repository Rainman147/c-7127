import React, { useEffect } from 'react';
import { useTemplateContext } from '@/contexts/TemplateContext';
import { TemplateSelector } from '../TemplateSelector';
import { TemplateManager } from '../template/TemplateManager';

interface ChatContainerProps {
  activeSessionId: string | null;
}

const ChatContainer = ({ activeSessionId }: ChatContainerProps) => {
  const { globalTemplate } = useTemplateContext();

  useEffect(() => {
    console.log('[ChatContainer] Component mounted/updated:', {
      activeSessionId,
      globalTemplateId: globalTemplate?.id
    });

    return () => {
      console.log('[ChatContainer] Component cleanup for session:', activeSessionId);
    };
  }, [activeSessionId, globalTemplate?.id]);

  return (
    <div className="chat-container">
      <TemplateSelector
        currentChatId={activeSessionId}
        onTemplateChange={(template) => {
          console.log('[ChatContainer] Template changed:', {
            sessionId: activeSessionId,
            templateId: template.id,
            templateName: template.name
          });
        }}
      />
      <TemplateManager />
    </div>
  );
};

export default ChatContainer;