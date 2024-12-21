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
    const saved = localStorage.getItem('selectedTemplate');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('[TemplateProvider] Error parsing saved template:', e);
      }
    }
    return getDefaultTemplate();
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[TemplateProvider] Template state updated:', globalTemplate.name);
    }
    localStorage.setItem('selectedTemplate', JSON.stringify(globalTemplate));
  }, [globalTemplate]);

  const setGlobalTemplate = useCallback((newTemplate: Template) => {
    if (newTemplate.id === globalTemplate.id) {
      console.log('[TemplateProvider] Skipping duplicate template update');
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[TemplateProvider] Setting new template:', newTemplate.name);
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