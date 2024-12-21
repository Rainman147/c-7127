import React, { useEffect } from 'react';
import { useTemplateContext } from '@/contexts/TemplateContext';
import { TemplateSelector } from '../TemplateSelector';
import { TemplateManager } from '../template/TemplateManager';
import { useSessionParams } from '@/hooks/routing/useSessionParams';
import type { Template } from '@/components/template/templateTypes';

interface ChatContainerProps {
  activeSessionId: string | null;
}

const ChatContainer = ({ activeSessionId }: ChatContainerProps) => {
  const { globalTemplate } = useTemplateContext();
  const { sessionId } = useSessionParams();

  useEffect(() => {
    console.log('[ChatContainer] Component mounted/updated:', {
      activeSessionId,
      globalTemplateId: globalTemplate?.id,
      sessionId
    });

    return () => {
      console.log('[ChatContainer] Component cleanup for session:', activeSessionId);
    };
  }, [activeSessionId, globalTemplate?.id, sessionId]);

  return (
    <div className="chat-container">
      <TemplateSelector
        onTemplateChange={(template: Template) => {
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