import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStateTransitionService } from './stateTransitionService';
import { usePatientStateService } from './patientStateService';
import type { Template } from '@/components/template/types';
import type { Patient } from '@/types';

export const useURLStateService = (currentChatId: string | null) => {
  const [searchParams] = useSearchParams();
  const { handleTemplateTransition } = useStateTransitionService();
  const { handlePatientTransition } = usePatientStateService();

  const urlState = useMemo(() => ({
    templateId: searchParams.get('templateId'),
    patientId: searchParams.get('patientId')
  }), [searchParams]);

  const handleTemplateChange = useCallback((template: Template) => {
    console.log('[URLStateService] Template change requested:', template.name);
    handleTemplateTransition(template, currentChatId, urlState.patientId);
  }, [currentChatId, handleTemplateTransition, urlState.patientId]);

  const handlePatientChange = useCallback((patient: Patient | null) => {
    console.log('[URLStateService] Patient change requested:', patient?.name);
    handlePatientTransition(patient, currentChatId, urlState.templateId);
  }, [currentChatId, handlePatientTransition, urlState.templateId]);

  return {
    urlState,
    handleTemplateChange,
    handlePatientChange
  };
};