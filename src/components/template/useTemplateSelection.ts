import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Template } from "./types";
import { templates } from "./types";

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange: (template: Template) => void
) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) {
        console.log('No chat ID, using default template');
        setSelectedTemplate(templates[0]);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('chats')
          .select('template_type')
          .eq('id', currentChatId)
          .single();

        if (error) throw error;

        if (data?.template_type) {
          const template = templates.find(t => t.id === data.template_type);
          if (template) {
            console.log('Setting template from database:', template.name);
            setSelectedTemplate(template);
            onTemplateChange(template);
          }
        }
      } catch (error) {
        console.error('Error loading template:', error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateForChat();
  }, [currentChatId, onTemplateChange, toast]);

  const handleTemplateChange = async (template: Template) => {
    console.log('Handling template change to:', template.name);
    if (!currentChatId || template.id === selectedTemplate.id) {
      console.log('No changes needed - same template or no chat ID');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chats')
        .update({ template_type: template.id })
        .eq('id', currentChatId);

      if (error) throw error;

      setSelectedTemplate(template);
      onTemplateChange(template);

      toast({
        title: "Template Changed",
        description: `Now using: ${template.name}`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    selectedTemplate,
    isLoading,
    handleTemplateChange
  };
};