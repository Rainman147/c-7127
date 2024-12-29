import { useCallback } from "react";
import { useSessionParams } from "@/hooks/routing/useSessionParams";
import { supabase } from "@/integrations/supabase/client";
import type { Template } from "@/components/template/templateTypes";

export const useTemplatePersistence = () => {
  const { sessionId } = useSessionParams();

  const loadTemplate = useCallback(async () => {
    if (!sessionId) {
      console.log('[useTemplatePersistence] No session ID provided');
      return null;
    }

    try {
      const { data: chat } = await supabase
        .from('chats')
        .select('template_type')
        .eq('id', sessionId)
        .single();

      if (chat?.template_type) {
        console.log('[useTemplatePersistence] Found template in database:', chat.template_type);
        return chat.template_type;
      }
    } catch (error) {
      console.error('[useTemplatePersistence] Failed to load template:', error);
    }
    return null;
  }, [sessionId]);

  const saveTemplate = useCallback(async (template: Template) => {
    if (!sessionId) {
      console.log('[useTemplatePersistence] No session ID provided, skipping save');
      return;
    }

    try {
      await supabase
        .from('chats')
        .update({ template_type: template.id })
        .eq('id', sessionId);
      console.log('[useTemplatePersistence] Template saved successfully');
    } catch (error) {
      console.error('[useTemplatePersistence] Failed to save template:', error);
    }
  }, [sessionId]);

  return { loadTemplate, saveTemplate };
};