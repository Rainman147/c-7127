import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/types';

export const usePatientStateService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePatientTransition = useCallback(async (
    patient: Patient | null,
    currentChatId: string | null,
    templateId: string | null
  ) => {
    console.log('[PatientStateService] Patient transition:', patient?.name);
    
    try {
      const params = new URLSearchParams();
      
      // Add parameters in consistent order
      if (templateId) {
        params.set('templateId', templateId);
      }
      if (patient?.id) {
        params.set('patientId', patient.id);
      }

      const queryString = params.toString();
      const baseUrl = currentChatId ? `/c/${currentChatId}` : '/';
      const newUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      console.log('[PatientStateService] Navigating to:', newUrl);
      navigate(newUrl, { replace: true });

    } catch (error) {
      console.error('[PatientStateService] Error during patient transition:', error);
      toast({
        title: "Error",
        description: "Failed to update patient state",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  return {
    handlePatientTransition
  };
};