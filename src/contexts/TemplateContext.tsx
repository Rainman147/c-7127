import { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { getDefaultTemplate } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/templateTypes';

interface TemplateContextType {
  globalTemplate: Template;
  setGlobalTemplate: (template: Template) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider = ({ children }: { children: React.ReactNode }) => {
  const [globalTemplate, setGlobalTemplateState] = useState<Template>(() => {
    console.log('[TemplateProvider] Initializing global template');
    const saved = localStorage.getItem('selectedTemplate');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('[TemplateProvider] Loaded saved template:', parsed.name);
        return parsed;
      } catch (e) {
        console.error('[TemplateProvider] Error parsing saved template:', e);
      }
    }
    const defaultTemplate = getDefaultTemplate();
    console.log('[TemplateProvider] Using default template:', defaultTemplate.name);
    return defaultTemplate;
  });

  useEffect(() => {
    console.log('[TemplateProvider] Template state updated:', {
      templateId: globalTemplate.id,
      templateName: globalTemplate.name
    });
    localStorage.setItem('selectedTemplate', JSON.stringify(globalTemplate));
  }, [globalTemplate]);

  const setGlobalTemplate = useCallback((newTemplate: Template) => {
    console.log('[TemplateProvider] Setting new template:', {
      currentId: globalTemplate.id,
      newId: newTemplate.id,
      templateName: newTemplate.name
    });
    
    if (newTemplate.id === globalTemplate.id) {
      console.log('[TemplateProvider] Skipping duplicate template update');
      return;
    }
    
    setGlobalTemplateState(newTemplate);
  }, [globalTemplate.id]);

  return (
    <TemplateContext.Provider value={{ globalTemplate, setGlobalTemplate }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplateContext must be used within a TemplateProvider');
  }
  return context;
};