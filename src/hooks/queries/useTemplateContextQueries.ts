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

const MAX_CONTEXT_VERSIONS = 10; // Keep last 10 versions

export const useTemplateContextQueries = (chatId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for current context
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
        .maybeSingle();

      if (error) throw error;
      return data as TemplateContext | null;
    },
    enabled: !!chatId
  });

  // Query for context history
  const { data: contextHistory } = useQuery({
    queryKey: ['templateContextHistory', chatId],
    queryFn: async () => {
      if (!chatId) return [];

      const { data, error } = await supabase
        .from('template_contexts')
        .select('*')
        .eq('chat_id', chatId)
        .order('version', { ascending: false });

      if (error) throw error;
      return data as TemplateContext[];
    },
    enabled: !!chatId
  });

  // Create new context
  const createContextMutation = useMutation({
    mutationFn: async ({ 
      template,
      patientId 
    }: { 
      template: Template;
      patientId?: string | null;
    }) => {
      if (!chatId) throw new Error('No chat ID provided');
      
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Validate system instructions
      if (!template.systemInstructions?.trim()) {
        throw new Error('System instructions are required');
      }

      // Create new context
      const { data: newContext, error: insertError } = await supabase
        .from('template_contexts')
        .insert({
          chat_id: chatId,
          template_id: template.id,
          system_instructions: template.systemInstructions,
          metadata: { patientId },
          user_id: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Cleanup old versions if needed
      if (contextHistory && contextHistory.length > MAX_CONTEXT_VERSIONS) {
        const versionsToDelete = contextHistory
          .slice(MAX_CONTEXT_VERSIONS)
          .map(ctx => ctx.id);

        const { error: cleanupError } = await supabase
          .from('template_contexts')
          .delete()
          .in('id', versionsToDelete);

        if (cleanupError) {
          console.error('Error cleaning up old context versions:', cleanupError);
        }
      }

      return newContext;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateContext', chatId] });
      queryClient.invalidateQueries({ queryKey: ['templateContextHistory', chatId] });
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

  // Restore specific context version
  const restoreContextMutation = useMutation({
    mutationFn: async (version: number) => {
      if (!chatId) throw new Error('No chat ID provided');
      if (!contextHistory?.length) throw new Error('No context history available');

      const contextToRestore = contextHistory.find(ctx => ctx.version === version);
      if (!contextToRestore) throw new Error('Context version not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('template_contexts')
        .insert({
          chat_id: chatId,
          template_id: contextToRestore.template_id,
          system_instructions: contextToRestore.system_instructions,
          metadata: contextToRestore.metadata,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateContext', chatId] });
      queryClient.invalidateQueries({ queryKey: ['templateContextHistory', chatId] });
      toast({
        title: "Success",
        description: "Template context restored successfully",
      });
    },
    onError: (error) => {
      console.error('[useTemplateContextQueries] Error restoring context:', error);
      toast({
        title: "Error",
        description: "Failed to restore template context",
        variant: "destructive",
      });
    }
  });

  return {
    currentContext,
    contextHistory,
    isLoading,
    createContext: createContextMutation.mutate,
    restoreContext: restoreContextMutation.mutate
  };
};