import React from 'react';
import { useTemplateContext } from '@/contexts/TemplateContext';
import { TemplateSelector } from '../TemplateSelector';
import { TemplateManager } from '../template/TemplateManager';

interface ChatContainerProps {
  activeSessionId: string | null;
}

const ChatContainer = ({ activeSessionId }: ChatContainerProps) => {
  const { globalTemplate } = useTemplateContext();

  console.log('[ChatContainer] Rendering with activeSessionId:', activeSessionId);

  return (
    <div className="chat-container">
      <TemplateSelector
        currentChatId={activeSessionId}
        onTemplateChange={(template) => {
          console.log('[ChatContainer] Template changed to:', template.name);
        }}
      />
      <TemplateManager />
    </div>
  );
};

export default ChatContainer;