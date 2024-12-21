import { createContext, useContext, useEffect, useState } from 'react';
import { getDefaultTemplate } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/templateTypes';

interface TemplateContextType {
  globalTemplate: Template;
  setGlobalTemplate: (template: Template) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider = ({ children }: { children: React.ReactNode }) => {
  const [globalTemplate, setGlobalTemplate] = useState<Template>(() => {
    // Try to load from localStorage first
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
    console.log('[TemplateProvider] Saving template to localStorage:', globalTemplate.name);
    localStorage.setItem('selectedTemplate', JSON.stringify(globalTemplate));
  }, [globalTemplate]);

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
