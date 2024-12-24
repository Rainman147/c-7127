import { useCallback, useRef, useEffect } from "react";
import { useSessionParams } from "@/hooks/routing/useSessionParams";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@/components/template/templateTypes";

export const useTemplatePersistence = () => {
  const { sessionId } = useSessionParams();
  const { toast } = useToast();
  const isMounted = useRef(false);

  useEffect(() => {
    console.log('[useTemplatePersistence] Component mounted');
    isMounted.current = true;
    return () => {
      console.log('[useTemplatePersistence] Component unmounting');
      isMounted.current = false;
    };
  }, []);

  const loadTemplate = useCallback(async () => {
    if (!sessionId) {
      console.log('[useTemplatePersistence] No session ID provided');
      return null;
    }

    try {
      console.log('[useTemplatePersistence] Loading template for chat:', sessionId);
      
      const { data: chat, error } = await supabase
        .from('chats')
        .select('template_type')
        .eq('id', sessionId)
        .maybeSingle();

      if (!isMounted.current) {
        console.log('[useTemplatePersistence] Component unmounted, skipping state update');
        return null;
      }

      if (error) {
        console.error('[useTemplatePersistence] Database error:', error);
        toast({
          title: "Error loading template",
          description: "Failed to load chat template",
          variant: "destructive"
        });
        return null;
      }

      if (!chat) {
        console.log('[useTemplatePersistence] No chat found for ID:', sessionId);
        return null;
      }

      console.log('[useTemplatePersistence] Found template:', chat.template_type);
      return chat.template_type;
      
    } catch (error) {
      if (isMounted.current) {
        console.error('[useTemplatePersistence] Failed to load template:', error);
        toast({
          title: "Error",
          description: "Failed to load chat template",
          variant: "destructive"
        });
      }
      return null;
    }
  }, [sessionId, toast]);

  const saveTemplate = useCallback(async (template: Template) => {
    if (!sessionId) {
      console.log('[useTemplatePersistence] No session ID provided, skipping save');
      return;
    }

    try {
      console.log('[useTemplatePersistence] Saving template:', {
        sessionId,
        templateId: template.id
      });

      const { error } = await supabase
        .from('chats')
        .update({ template_type: template.id })
        .eq('id', sessionId);

      if (!isMounted.current) {
        console.log('[useTemplatePersistence] Component unmounted, skipping state update');
        return;
      }

      if (error) {
        console.error('[useTemplatePersistence] Failed to save template:', error);
        toast({
          title: "Error",
          description: "Failed to save template changes",
          variant: "destructive"
        });
      } else {
        console.log('[useTemplatePersistence] Template saved successfully');
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('[useTemplatePersistence] Error saving template:', error);
        toast({
          title: "Error",
          description: "Failed to save template changes",
          variant: "destructive"
        });
      }
    }
  }, [sessionId, toast]);

  return { loadTemplate, saveTemplate };
};