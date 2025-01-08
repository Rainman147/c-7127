import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getDefaultTemplate, findTemplateById } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/types';

export const useTemplateHandling = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(() => {
    const defaultTemplate = getDefaultTemplate();
    console.log('[useTemplateHandling] Setting default template:', defaultTemplate.name);
    return defaultTemplate;
  });

  const handleTemplateChange = useCallback((template: Template) => {
    console.log('[useTemplateHandling] Template changed to:', template.name);
    setCurrentTemplate(template);
    
    try {
      const params = new URLSearchParams(location.search);
      const patientId = params.get('patientId');
      
      // Clear parameters if switching to default template without patient
      if (template.id === getDefaultTemplate().id && !patientId) {
        console.log('[useTemplateHandling] Removing template from URL (default template, no patient)');
        navigate(location.pathname, { replace: true });
        return;
      }
      
      // Update template in URL
      params.set('templateId', template.id);
      console.log('[useTemplateHandling] Updating template in URL:', template.id);
      
      // Maintain parameter order: templateId first, then patientId
      const orderedParams = new URLSearchParams();
      orderedParams.set('templateId', template.id);
      if (patientId) {
        orderedParams.set('patientId', patientId);
      }
      
      const search = orderedParams.toString();
      const newUrl = search ? `${location.pathname}?${search}` : location.pathname;
      
      navigate(newUrl, { replace: true });
    } catch (error) {
      console.error('[useTemplateHandling] Navigation error:', error);
      toast({
        title: "Error",
        description: "Failed to update URL with template selection",
        variant: "destructive",
      });
    }
  }, [location.pathname, location.search, navigate, toast]);

  return {
    currentTemplate,
    handleTemplateChange
  };
};