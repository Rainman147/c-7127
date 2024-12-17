import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Template } from "./types";
import { templates } from "./types";

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void
) => {
  console.log('[useTemplateSelection] Hook initialized with chatId:', currentChatId);
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) {
        console.log('[useTemplateSelection] No chat ID provided, using default template');
        return;
      }

      console.log('[useTemplateSelection] Loading template for chat:', currentChatId);
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('chats')
          .select('template_type')
          .eq('id', currentChatId)
          .maybeSingle(); // Changed from single() to maybeSingle()

        if (error) {
          console.error('[useTemplateSelection] Error loading template:', error);
          throw error;
        }

        if (data?.template_type) {
          const template = templates.find(t => t.id === data.template_type);
          if (template) {
            console.log('[useTemplateSelection] Found template in database:', template.name);
            setSelectedTemplate(template);
            onTemplateChange(template);
          }
        } else {
          console.log('[useTemplateSelection] No template found, using default');
          // Use default template if none is found
          setSelectedTemplate(templates[0]);
          onTemplateChange(templates[0]);
        }
      } catch (error) {
        console.error('[useTemplateSelection] Failed to load template:', error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.log('[useTemplateSelection] Template loading completed');
      }
    };

    loadTemplateForChat();
  }, [currentChatId, onTemplateChange, toast]);

  const handleTemplateChange = useCallback(async (template: Template) => {
    console.log('[useTemplateSelection] Template change requested:', template.name);
    
    if (template.id === selectedTemplate.id) {
      console.log('[useTemplateSelection] Same template selected, no changes needed');
      return;
    }

    setIsLoading(true);
    try {
      setSelectedTemplate(template);
      onTemplateChange(template);

      if (currentChatId) {
        console.log('[useTemplateSelection] Saving template selection to database:', {
          chatId: currentChatId,
          templateId: template.id
        });
        
        const { error } = await supabase
          .from('chats')
          .update({ template_type: template.id })
          .eq('id', currentChatId);

        if (error) {
          console.error('[useTemplateSelection] Error saving template:', error);
          throw error;
        }
      }

      toast({
        title: "Template Changed",
        description: `Now using: ${template.name}`,
        duration: 3000,
      });
      
      console.log('[useTemplateSelection] Template change completed successfully');
    } catch (error: any) {
      console.error('[useTemplateSelection] Failed to update template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, selectedTemplate.id, onTemplateChange, toast]);

  return {
    selectedTemplate,
    isLoading,
    handleTemplateChange
  };
};