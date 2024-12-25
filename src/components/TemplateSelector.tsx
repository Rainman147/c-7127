import { memo, useCallback, useEffect, useMemo } from "react";
import { ErrorTracker } from "@/utils/errorTracking";
import type { ErrorMetadata } from "@/types/errorTracking";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TemplateTrigger } from "./template/dropdown/TemplateTrigger";
import { TemplateDropdownContent } from "./template/dropdown/TemplateDropdownContent";
import { useTemplateSelection } from "./template/useTemplateSelection";
import { useSessionParams } from "@/hooks/routing/useSessionParams";
import { useTemplateContext } from "@/contexts/TemplateContext";
import type { Template } from "@/components/template/templateTypes";

interface TemplateSelectorProps {
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = memo(({ onTemplateChange }: TemplateSelectorProps) => {
  const { sessionId, templateId } = useSessionParams();
  const { globalTemplate } = useTemplateContext();
  const loadStartTime = useRef(Date.now());
  
  useEffect(() => {
    try {
      console.log('[TemplateSelector] Component mounted/updated:', {
        sessionId,
        templateId,
        loadStartTime: loadStartTime.current
      });
    } catch (error) {
      const metadata: ErrorMetadata = {
        component: 'TemplateSelector',
        severity: 'low',
        timestamp: new Date().toISOString(),
        errorType: 'lifecycle',
        operation: 'component-mount',
        additionalInfo: { 
          sessionId, 
          templateId,
          loadDuration: Date.now() - loadStartTime.current
        }
      };
      ErrorTracker.trackError(error as Error, metadata);
    }

    return () => {
      console.log('[TemplateSelector] Component cleanup for chat:', sessionId);
    };
  }, [sessionId, templateId]);

  const { 
    selectedTemplate, 
    availableTemplates, 
    isLoading, 
    handleTemplateChange 
  } = useTemplateSelection(onTemplateChange, globalTemplate);

  const handleTemplateSelect = useCallback((template: Template) => {
    try {
      const startTime = Date.now();
      console.log('[TemplateSelector] Template selection requested:', {
        sessionId,
        currentTemplateId: selectedTemplate?.id,
        newTemplateId: template.id,
        templateName: template.name
      });

      if (template.id === selectedTemplate?.id) {
        console.log('[TemplateSelector] Skipping duplicate template selection');
        return;
      }
      
      handleTemplateChange(template);
    } catch (error) {
      const loadDuration = Date.now() - loadStartTime.current;
      const metadata: ErrorMetadata = {
        component: 'TemplateSelector',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        errorType: 'selection',
        operation: 'select-template',
        additionalInfo: {
          templateId: template.id,
          templateName: template.name,
          sessionId,
          loadDuration,
          timeoutThreshold: 5000,
          isTimeout: loadDuration > 5000
        }
      };
      ErrorTracker.trackError(error as Error, metadata);
    }
  }, [handleTemplateChange, sessionId, selectedTemplate?.id]);

  const displayTemplate = useMemo(() => {
    try {
      console.log('[TemplateSelector] Display template updated:', {
        sessionId,
        templateId: selectedTemplate?.id,
        templateName: selectedTemplate?.name
      });
      return selectedTemplate;
    } catch (error) {
      const metadata: ErrorMetadata = {
        component: 'TemplateSelector',
        severity: 'low',
        timestamp: new Date().toISOString(),
        errorType: 'render',
        operation: 'update-display',
        additionalInfo: {
          templateId: selectedTemplate?.id,
          sessionId,
          loadDuration: Date.now() - loadStartTime.current
        }
      };
      ErrorTracker.trackError(error as Error, metadata);
      return selectedTemplate;
    }
  }, [selectedTemplate, sessionId]);

  return (
    <DropdownMenu>
      <TemplateTrigger 
        displayTemplate={displayTemplate}
        isLoading={isLoading}
      />
      <TemplateDropdownContent 
        templates={availableTemplates}
        selectedTemplateId={displayTemplate?.id}
        onTemplateSelect={handleTemplateSelect}
        isLoading={isLoading}
      />
    </DropdownMenu>
  );
});

TemplateSelector.displayName = 'TemplateSelector';