import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStateTransitionService } from './stateTransitionService';
import type { Template } from '@/components/template/types';

export const useURLStateService = (currentChatId: string | null) => {
  const [searchParams] = useSearchParams();
  const { handleTemplateTransition } = useStateTransitionService();

  const urlState = useMemo(() => ({
    templateId: searchParams.get('templateId'),
    patientId: searchParams.get('patientId')
  }), [searchParams]);

  const handleTemplateChange = useCallback((template: Template) => {
    console.log('[URLStateService] Template change requested:', template.name);
    handleTemplateTransition(template, currentChatId, urlState.patientId);
  }, [currentChatId, handleTemplateTransition, urlState.patientId]);

  return {
    urlState,
    handleTemplateChange
  };
};