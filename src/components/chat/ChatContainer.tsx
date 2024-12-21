import React, { useEffect } from 'react';
import { useTemplateContext } from '@/contexts/TemplateContext';
import { TemplateSelector } from '../TemplateSelector';
import { TemplateManager } from '../template/TemplateManager';
import { useSessionParams } from '@/hooks/routing/useSessionParams';
import type { Template } from '@/components/template/templateTypes';

const ChatContainer = () => {
  const { globalTemplate } = useTemplateContext();
  const { sessionId } = useSessionParams();

  useEffect(() => {
    console.log('[ChatContainer] Component mounted/updated:', {
      globalTemplateId: globalTemplate?.id,
      sessionId
    });

    return () => {
      console.log('[ChatContainer] Component cleanup for session:', sessionId);
    };
  }, [globalTemplate?.id, sessionId]);

  return (
    <div className="chat-container">
      <TemplateSelector
        onTemplateChange={(template: Template) => {
          console.log('[ChatContainer] Template changed:', {
            sessionId,
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