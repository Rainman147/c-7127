import { useCallback } from "react";
import { useSessionParams } from "@/hooks/routing/useSessionParams";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@/components/template/templateTypes";

export const useTemplatePersistence = () => {
  const { sessionId } = useSessionParams();
  const { toast } = useToast();

  const loadTemplate = useCallback(async () => {
    if (!sessionId) {
      console.log('[useTemplatePersistence] No session ID provided');
      return null;
    }

    try {
      // First check if we're authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.error('[useTemplatePersistence] Authentication error:', authError);
        toast({
          title: "Authentication Error",
          description: "Please sign in to access templates",
          variant: "destructive"
        });
        return null;
      }

      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('template_type')
        .eq('id', sessionId)
        .maybeSingle();

      if (chatError) {
        console.error('[useTemplatePersistence] Failed to load template:', chatError);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive"
        });
        return null;
      }

      if (chat?.template_type) {
        console.log('[useTemplatePersistence] Found template in database:', chat.template_type);
        return chat.template_type;
      }
    } catch (error) {
      console.error('[useTemplatePersistence] Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
    return null;
  }, [sessionId, toast]);

  const saveTemplate = useCallback(async (template: Template) => {
    if (!sessionId) {
      console.log('[useTemplatePersistence] No session ID provided, skipping save');
      return;
    }

    try {
      // Check authentication before saving
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.error('[useTemplatePersistence] Authentication error:', authError);
        toast({
          title: "Authentication Error",
          description: "Please sign in to save templates",
          variant: "destructive"
        });
        return;
      }

      const { error: saveError } = await supabase
        .from('chats')
        .update({ template_type: template.id })
        .eq('id', sessionId);

      if (saveError) {
        console.error('[useTemplatePersistence] Failed to save template:', saveError);
        toast({
          title: "Error",
          description: "Failed to save template settings",
          variant: "destructive"
        });
        return;
      }

      console.log('[useTemplatePersistence] Template saved successfully');
      toast({
        title: "Success",
        description: "Template settings saved",
      });
    } catch (error) {
      console.error('[useTemplatePersistence] Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving",
        variant: "destructive"
      });
    }
  }, [sessionId, toast]);

  return { loadTemplate, saveTemplate };
};