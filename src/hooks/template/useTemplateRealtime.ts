import { useEffect } from 'react';
import { useRealTime } from '@/contexts/RealTimeContext';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import type { Template } from '@/components/template/templateTypes';

export const useTemplateRealtime = (onTemplateChange: (template: Template) => void) => {
  const { subscribe, cleanup } = useRealTime();
  const { toast } = useToast();

  useEffect(() => {
    logger.debug(LogCategory.WEBSOCKET, 'useTemplateRealtime', 'Setting up template subscriptions');
    
    const channel = subscribe({
      schema: 'public',
      table: 'templates',
      event: '*',
      onMessage: (payload) => {
        logger.debug(LogCategory.WEBSOCKET, 'useTemplateRealtime', 'Received template update:', payload);
        
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
          case 'INSERT':
            toast({
              title: 'New Template',
              description: `Template "${newRecord.name}" has been created`,
            });
            onTemplateChange(newRecord as Template);
            break;
            
          case 'UPDATE':
            toast({
              title: 'Template Updated',
              description: `Template "${newRecord.name}" has been updated`,
            });
            onTemplateChange(newRecord as Template);
            break;
            
          case 'DELETE':
            toast({
              title: 'Template Deleted',
              description: `Template "${oldRecord.name}" has been removed`,
            });
            break;
        }
      },
      onError: (error) => {
        logger.error(LogCategory.WEBSOCKET, 'useTemplateRealtime', 'Subscription error:', error);
        toast({
          title: 'Error',
          description: 'Failed to sync template changes',
          variant: 'destructive',
        });
      }
    });

    return () => {
      logger.debug(LogCategory.WEBSOCKET, 'useTemplateRealtime', 'Cleaning up template subscriptions');
      cleanup();
    };
  }, [subscribe, cleanup, toast, onTemplateChange]);
};