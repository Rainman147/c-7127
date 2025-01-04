import { useSearchParams, useNavigate } from 'react-router-dom';
import { validateTemplateId } from '@/utils/template/urlParamValidation';
import { getDefaultTemplate } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/types';

export interface URLState {
  templateId: string | null;
  patientId: string | null;
  sessionId: string | null;
}

export const useURLStateService = (currentChatId: string | null) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  console.log('[URLStateService] Initializing with chatId:', currentChatId);

  const getCurrentState = (): URLState => ({
    templateId: searchParams.get('templateId'),
    patientId: searchParams.get('patientId'),
    sessionId: currentChatId
  });

  const updateURLParameters = (
    updates: Partial<URLState>,
    options: { replace?: boolean } = {}
  ) => {
    console.log('[URLStateService] Updating URL parameters:', updates);
    
    const params = new URLSearchParams(searchParams);
    const baseUrl = updates.sessionId || currentChatId 
      ? `/c/${updates.sessionId || currentChatId}` 
      : '/';
    
    // Maintain parameter order: templateId first, then patientId
    ['templateId', 'patientId'].forEach(param => {
      const value = updates[param as keyof URLState];
      if (value === null) {
        params.delete(param);
      } else if (value !== undefined) {
        params.set(param, value);
      }
    });
    
    // Clean URL if using default template without patient
    if (params.get('templateId') === getDefaultTemplate().id && !params.get('patientId')) {
      params.delete('templateId');
    }
    
    const search = params.toString();
    const newUrl = search ? `${baseUrl}?${search}` : baseUrl;
    
    console.log('[URLStateService] New URL:', newUrl);
    navigate(newUrl, { replace: options.replace });
  };

  const handleTemplateChange = (template: Template) => {
    console.log('[URLStateService] Template change requested:', template.name);
    
    if (validateTemplateId(template.id)) {
      const currentState = getCurrentState();
      updateURLParameters({
        templateId: template.id,
        patientId: currentState.patientId
      });
    } else {
      console.error('[URLStateService] Invalid template ID:', template.id);
    }
  };

  const handlePatientChange = (patientId: string | null) => {
    console.log('[URLStateService] Patient change requested:', patientId);
    
    const currentState = getCurrentState();
    updateURLParameters({
      templateId: currentState.templateId,
      patientId
    });
  };

  return {
    urlState: getCurrentState(),
    updateURLParameters,
    handleTemplateChange,
    handlePatientChange
  };
};