import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { validateTemplateId } from '@/utils/template/urlParamValidation';
import { getDefaultTemplate } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/types';
import type { Patient } from '@/types';

export const useUrlStateManager = (currentChatId: string | null) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const updateUrlParameters = useCallback((
    templateId?: string | null,
    patientId?: string | null
  ) => {
    console.log('[useUrlStateManager] Updating URL parameters:', { templateId, patientId });
    
    const params = new URLSearchParams(searchParams);
    const baseUrl = currentChatId ? `/c/${currentChatId}` : '/';
    
    // Clear existing parameters
    params.delete('templateId');
    params.delete('patientId');
    
    // Add new parameters in correct order
    if (templateId && templateId !== getDefaultTemplate().id) {
      params.set('templateId', templateId);
    }
    
    if (patientId) {
      params.set('patientId', patientId);
    }
    
    const search = params.toString();
    const newUrl = search ? `${baseUrl}?${search}` : baseUrl;
    
    console.log('[useUrlStateManager] New URL:', newUrl);
    navigate(newUrl, { replace: true });
  }, [searchParams, currentChatId, navigate]);

  const handleTemplateChange = useCallback((template: Template) => {
    console.log('[useUrlStateManager] Template change requested:', template.name);
    
    if (validateTemplateId(template.id)) {
      const currentPatientId = searchParams.get('patientId');
      updateUrlParameters(template.id, currentPatientId);
    } else {
      console.error('[useUrlStateManager] Invalid template ID:', template.id);
    }
  }, [searchParams, updateUrlParameters]);

  const handlePatientChange = useCallback((patient: Patient | null) => {
    console.log('[useUrlStateManager] Patient change requested:', patient?.name);
    
    const currentTemplateId = searchParams.get('templateId');
    updateUrlParameters(currentTemplateId, patient?.id || null);
  }, [searchParams, updateUrlParameters]);

  return {
    templateId: searchParams.get('templateId'),
    patientId: searchParams.get('patientId'),
    updateUrlParameters,
    handleTemplateChange,
    handlePatientChange
  };
};