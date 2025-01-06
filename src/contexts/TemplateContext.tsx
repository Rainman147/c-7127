import { createContext, useContext, ReactNode } from 'react';
import type { Template } from '@/components/template/types';

interface TemplateContextType {
  currentTemplate: Template | null;
  setCurrentTemplate: (template: Template | null) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  return (
    <TemplateContext.Provider value={{ currentTemplate, setCurrentTemplate }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
}