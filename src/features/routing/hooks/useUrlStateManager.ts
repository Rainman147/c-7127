import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { validateTemplateId } from '@/utils/template/urlParamValidation';
import { getDefaultTemplate } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/types';

export interface UrlState {
  templateId: string | null;
  patientId: string | null;
  sessionId: string | null;
}

export const useUrlStateManager = (currentChatId: string | null) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  console.log('[useUrlStateManager] Initializing with chatId:', currentChatId);

  const getCurrentState = useCallback((): UrlState => ({
    templateId: searchParams.get('templateId'),
    patientId: searchParams.get('patientId'),
    sessionId: currentChatId
  }), [searchParams, currentChatId]);

  const updateUrlParameters = useCallback((
    updates: Partial<UrlState>,
    options: { replace?: boolean } = {}
  ) => {
    console.log('[useUrlStateManager] Updating URL parameters:', updates);
    
    const params = new URLSearchParams(searchParams);
    const baseUrl = updates.sessionId || currentChatId ? `/c/${updates.sessionId || currentChatId}` : '/';
    
    // Maintain parameter order: templateId first, then patientId
    ['templateId', 'patientId'].forEach(param => {
      const value = updates[param as keyof UrlState];
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
    
    console.log('[useUrlStateManager] New URL:', newUrl);
    navigate(newUrl, { replace: options.replace });
  }, [searchParams, currentChatId, navigate]);

  const handleTemplateChange = useCallback((template: Template) => {
    console.log('[useUrlStateManager] Template change requested:', template.name);
    
    if (validateTemplateId(template.id)) {
      const currentState = getCurrentState();
      updateUrlParameters({
        templateId: template.id,
        patientId: currentState.patientId
      });
    } else {
      console.error('[useUrlStateManager] Invalid template ID:', template.id);
    }
  }, [getCurrentState, updateUrlParameters]);

  const handlePatientChange = useCallback((patientId: string | null) => {
    console.log('[useUrlStateManager] Patient change requested:', patientId);
    
    const currentState = getCurrentState();
    updateUrlParameters({
      templateId: currentState.templateId,
      patientId
    });
  }, [getCurrentState, updateUrlParameters]);

  return {
    urlState: getCurrentState(),
    updateUrlParameters,
    handleTemplateChange,
    handlePatientChange
  };
};