import { useState, useEffect, useRef } from "react";
import type { Template } from "@/components/template/templateTypes";

export const useTemplateState = (globalTemplate: Template) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(globalTemplate);
  const [isLoading, setIsLoading] = useState(false);
  const globalTemplateRef = useRef(globalTemplate);

  useEffect(() => {
    console.log('[useTemplateState] Global template updated:', globalTemplate.name);
    globalTemplateRef.current = globalTemplate;
  }, [globalTemplate]);

  return {
    selectedTemplate,
    setSelectedTemplate,
    isLoading,
    setIsLoading,
    globalTemplateRef
  };
};