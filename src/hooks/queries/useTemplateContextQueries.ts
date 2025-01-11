import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Template } from "@/types/template";
import { useToast } from "@/hooks/use-toast";

interface TemplateContext {
  id: string;
  template_id: string;
  chat_id: string | null;
  message_id: string | null;
  system_instructions: string;
  metadata: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useTemplateContextQueries = (chatId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentContext, isLoading } = useQuery({
    queryKey: ['templateContext', chatId],
    queryFn: async () => {
      if (!chatId) return null;

      const { data, error } = await supabase
        .from('template_contexts')
        .select('*')
        .eq('chat_id', chatId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as TemplateContext;
    },
    enabled: !!chatId
  });

  const createContextMutation = useMutation({
    mutationFn: async ({ 
      template,
      patientId 
    }: { 
      template: Template;
      patientId?: string | null;
    }) => {
      if (!chatId) throw new Error('No chat ID provided');

      const { data, error } = await supabase
        .from('template_contexts')
        .insert({
          chat_id: chatId,
          template_id: template.id,
          system_instructions: template.systemInstructions,
          metadata: { patientId },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateContext', chatId] });
    },
    onError: (error) => {
      console.error('[useTemplateContextQueries] Error creating context:', error);
      toast({
        title: "Error",
        description: "Failed to create template context",
        variant: "destructive",
      });
    }
  });

  return {
    currentContext,
    isLoading,
    createContext: createContextMutation.mutate
  };
};