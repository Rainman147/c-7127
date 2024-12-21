import React from 'react';
import { useTemplateContext } from '@/contexts/TemplateContext';
import { TemplateSelector } from '../TemplateSelector';
import { TemplateManager } from '../template/TemplateManager';

const ChatContainer = () => {
  const { globalTemplate } = useTemplateContext();

  return (
    <div className="chat-container">
      <TemplateSelector
        currentChatId={null} // Replace with actual chat ID if available
        onTemplateChange={(template) => {
          console.log('Template changed to:', template.name);
        }}
      />
      <TemplateManager />
    </div>
  );
};

export default ChatContainer;