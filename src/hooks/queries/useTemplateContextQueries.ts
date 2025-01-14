import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatSystemContext } from "@/utils/contextFormatter";
import type { Template } from "@/types/template";
import type { PatientContext } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";

interface CreateTemplateContextInput {
  template: Template;
  patientId?: string | null;
  systemInstructions: string;
}

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
  template?: Template;
}

interface ValidationError {
  field: string;
  message: string;
}

const validateTemplateContext = (input: CreateTemplateContextInput): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!input.template.id) {
    errors.push({ field: 'template.id', message: 'Template ID is required' });
  }
  
  if (!input.systemInstructions) {
    errors.push({ field: 'systemInstructions', message: 'System instructions are required' });
  }
  
  return errors;
};

export const useTemplateContextQueries = (chatId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentContext, isLoading } = useQuery({
    queryKey: ['templateContext', chatId],
    queryFn: async () => {
      if (!chatId) return null;
      console.log('[useTemplateContextQueries] Fetching context for chat:', chatId);

      const { data, error } = await supabase
        .from('template_contexts')
        .select('*')
        .eq('chat_id', chatId)
        .order('version', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('[useTemplateContextQueries] Error fetching context:', error);
        throw error;
      }

      console.log('[useTemplateContextQueries] Fetched context:', data);
      return data as TemplateContext;
    },
    enabled: !!chatId
  });

  const createContextMutation = useMutation({
    mutationFn: async ({ 
      template,
      patientId,
      systemInstructions 
    }: CreateTemplateContextInput) => {
      if (!chatId) throw new Error('No chat ID provided');
      
      // Validate input
      const validationErrors = validateTemplateContext({ template, patientId, systemInstructions });
      if (validationErrors.length > 0) {
        console.error('[useTemplateContextQueries] Validation errors:', validationErrors);
        throw new Error(validationErrors.map(e => e.message).join(', '));
      }
      
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('template_contexts')
        .insert({
          chat_id: chatId,
          template_id: template.id,
          system_instructions: systemInstructions,
          metadata: { 
            templateName: template.name,
            templateDescription: template.description,
            patientId: patientId || null
          },
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('[useTemplateContextQueries] Error creating context:', error);
        throw error;
      }

      console.log('[useTemplateContextQueries] Created context:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateContext', chatId] });
      toast({
        title: "Template Context Updated",
        description: "Chat context has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('[useTemplateContextQueries] Error creating context:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create template context",
        variant: "destructive",
      });
    }
  });

  return {
    currentContext,
    isLoading,
    createContext: createContextMutation.mutate,
    error: createContextMutation.error
  };
};