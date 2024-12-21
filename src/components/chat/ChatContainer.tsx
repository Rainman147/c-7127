import React, { useEffect } from 'react';
import { TemplateSelector } from '../TemplateSelector';
import { TemplateManager } from '../template/TemplateManager';
import { useSessionParams } from '@/hooks/routing/useSessionParams';
import { useNavigate } from 'react-router-dom';
import type { Template } from '@/components/template/templateTypes';

const ChatContainer = () => {
  const { sessionId, templateId } = useSessionParams();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[ChatContainer] Component mounted/updated:', {
      sessionId,
      templateId
    });

    return () => {
      console.log('[ChatContainer] Component cleanup for session:', sessionId);
    };
  }, [sessionId, templateId]);

  const handleTemplateChange = (template: Template) => {
    console.log('[ChatContainer] Template changed:', {
      sessionId,
      templateId: template.id,
      templateName: template.name
    });

    // Update URL with new template while preserving other params
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('template', template.id);
    navigate({
      pathname: sessionId ? `/c/${sessionId}` : '/c/new',
      search: searchParams.toString()
    });
  };

  return (
    <div className="chat-container">
      <TemplateSelector onTemplateChange={handleTemplateChange} />
      <TemplateManager />
    </div>
  );
};

export default ChatContainer;