import React, { useEffect } from 'react';
import { TemplateSelector } from '../TemplateSelector';
import { TemplateManager } from '../template/TemplateManager';
import { useSessionParams } from '@/hooks/routing/useSessionParams';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import type { Template } from '@/components/template/templateTypes';

const ChatContainer = () => {
  const { sessionId, templateId } = useSessionParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    logger.debug(LogCategory.RENDER, 'ChatContainer', 'Component mounted/updated:', {
      sessionId,
      templateId
    });

    return () => {
      logger.debug(LogCategory.RENDER, 'ChatContainer', 'Component cleanup for session:', sessionId);
    };
  }, [sessionId, templateId]);

  const handleTemplateChange = async (template: Template) => {
    logger.info(LogCategory.STATE, 'ChatContainer', 'Template change requested:', {
      sessionId,
      templateId: template.id,
      templateName: template.name
    });

    try {
      // Update URL with new template while preserving other params
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('template', template.id);
      
      navigate({
        pathname: sessionId ? `/c/${sessionId}` : '/c/new',
        search: searchParams.toString()
      });

      logger.info(LogCategory.STATE, 'ChatContainer', 'Template changed successfully');
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatContainer', 'Error changing template:', error);
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="chat-container">
      <TemplateSelector onTemplateChange={handleTemplateChange} />
      <TemplateManager />
    </div>
  );
};

export default ChatContainer;