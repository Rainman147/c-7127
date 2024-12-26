import { useEffect, useId } from 'react';
import { useRealTime } from '@/contexts/RealTimeContext';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';

export const usePatientRealtime = () => {
  const { subscribe, cleanup } = useRealTime();
  const { toast } = useToast();
  const componentId = useId();

  useEffect(() => {
    logger.debug(LogCategory.WEBSOCKET, 'PatientGrid', 'Setting up patient subscriptions');
    
    const channel = subscribe({
      schema: 'public',
      table: 'patients',
      event: '*',
      onMessage: (payload) => {
        logger.debug(LogCategory.WEBSOCKET, 'PatientGrid', 'Received patient update:', payload);
        
        if (payload.eventType === 'INSERT') {
          toast({
            title: "New Patient Added",
            description: "The patient list has been updated",
          });
        } else if (payload.eventType === 'UPDATE') {
          toast({
            title: "Patient Updated",
            description: "Patient information has been modified",
          });
        } else if (payload.eventType === 'DELETE') {
          toast({
            title: "Patient Removed",
            description: "A patient has been removed from the list",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        logger.error(LogCategory.WEBSOCKET, 'PatientGrid', 'Subscription error:', error);
        toast({
          title: "Error",
          description: "Failed to sync patient updates",
          variant: "destructive",
        });
      }
    });

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'PatientGrid', 'Cleaning up patient subscriptions');
      cleanup();
    };
  }, [subscribe, cleanup, toast, componentId]);
};