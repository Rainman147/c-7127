import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/components/template/types';

interface StateTransition {
  currentChatId: string | null;
  templateId?: string | null;
  patientId?: string | null;
}

export const useStateTransitionService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStateTransition = useCallback(async ({
    currentChatId,
    templateId,
    patientId
  }: StateTransition) => {
    console.log('[StateTransitionService] Handling state transition:', {
      currentChatId,
      templateId,
      patientId
    });

    try {
      const params = new URLSearchParams();
      
      // Add parameters in consistent order
      if (templateId) {
        params.set('templateId', templateId);
      }
      if (patientId) {
        params.set('patientId', patientId);
      }

      const queryString = params.toString();
      const baseUrl = currentChatId ? `/c/${currentChatId}` : '/';
      const newUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      console.log('[StateTransitionService] Navigating to:', newUrl);
      navigate(newUrl, { replace: true });

    } catch (error) {
      console.error('[StateTransitionService] Error during state transition:', error);
      toast({
        title: "Error",
        description: "Failed to update chat state",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  const handleTemplateTransition = useCallback((
    template: Template,
    currentChatId: string | null,
    patientId: string | null
  ) => {
    console.log('[StateTransitionService] Template transition:', template.name);
    
    handleStateTransition({
      currentChatId,
      templateId: template.id,
      patientId
    });
  }, [handleStateTransition]);

  const handlePatientTransition = useCallback((
    patientId: string | null,
    currentChatId: string | null,
    templateId: string | null
  ) => {
    console.log('[StateTransitionService] Patient transition:', patientId);
    
    handleStateTransition({
      currentChatId,
      templateId,
      patientId
    });
  }, [handleStateTransition]);

  const handleChatSessionTransition = useCallback((
    chatId: string,
    templateId: string | null,
    patientId: string | null
  ) => {
    console.log('[StateTransitionService] Chat session transition:', chatId);
    
    handleStateTransition({
      currentChatId: chatId,
      templateId,
      patientId
    });
  }, [handleStateTransition]);

  return {
    handleTemplateTransition,
    handlePatientTransition,
    handleChatSessionTransition
  };
};