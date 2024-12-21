import type { Template } from "@/components/template/templateTypes";
import { useTemplateState } from "./useTemplateState";
import { useTemplateLoading } from "./useTemplateLoading";
import { useTemplateUpdates } from "./useTemplateUpdates";

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void,
  globalTemplate: Template
) => {
  console.log('[useTemplateSelection] Hook initialized with chatId:', currentChatId);
  
  const {
    selectedTemplate,
    setSelectedTemplate,
    isLoading,
    setIsLoading,
    globalTemplateRef
  } = useTemplateState(globalTemplate);

  const { availableTemplates } = useTemplateLoading(
    currentChatId,
    onTemplateChange,
    selectedTemplate,
    setSelectedTemplate,
    setIsLoading,
    globalTemplateRef
  );

  const { handleTemplateChange } = useTemplateUpdates(
    currentChatId,
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