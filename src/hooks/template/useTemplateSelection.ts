import type { Template } from "@/components/template/templateTypes";
import { useTemplateState } from "@/hooks/template/useTemplateState";
import { useTemplateLoading } from "@/hooks/template/useTemplateLoading";
import { useTemplateUpdates } from "@/hooks/template/useTemplateUpdates";
import { useSessionParams } from "@/hooks/routing/useSessionParams";

export interface UseTemplateSelectionResult {
  selectedTemplate: Template | null;
  availableTemplates: Template[];
  isLoading: boolean;
  handleTemplateChange: (template: Template) => void;
}

export const useTemplateSelection = (
  onTemplateChange: (template: Template) => void,
  globalTemplate: Template
): UseTemplateSelectionResult => {
  const { sessionId } = useSessionParams();
  console.log('[useTemplateSelection] Hook initialized with sessionId:', sessionId);
  
  const {
    selectedTemplate,
    setSelectedTemplate,
    isLoading,
    setIsLoading,
    globalTemplateRef
  } = useTemplateState(globalTemplate);

  const { availableTemplates } = useTemplateLoading();

  const { handleTemplateChange } = useTemplateUpdates(
    selectedTemplate,
    setSelectedTemplate,
    setIsLoading,
    onTemplateChange
  );

  return {
    selectedTemplate,
    availableTemplates,
    isLoading,
    handleTemplateChange
  };
};