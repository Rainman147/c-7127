import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Template } from '@/components/template/templateTypes';

interface SessionMetadata {
  templateId?: string;
  patientId?: string;
}

export const useSessionCoordinator = () => {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const createOrUpdateSession = useCallback(async (
    sessionId: string | null,
    metadata?: SessionMetadata
  ) => {
    if (isCreatingSession) {
      console.log('[useSessionCoordinator] Session creation already in progress');
      return null;
    }

    try {
      setIsCreatingSession(true);
      console.log('[useSessionCoordinator] Creating/updating session:', { sessionId, metadata });

      // If session exists, update it
      if (sessionId) {
        const { error: updateError } = await supabase
          .from('chats')
          .update({
            template_type: metadata?.templateId || 'live-session',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (updateError) throw updateError;
        console.log('[useSessionCoordinator] Updated existing session:', sessionId);
        return sessionId;
      }

      // Create new session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { data: session, error: createError } = await supabase
        .from('chats')
        .insert({
          title: 'New Chat',
          user_id: user.id,
          template_type: metadata?.templateId || 'live-session'
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log('[useSessionCoordinator] Created new session:', session.id);
      return session.id;

    } catch (error) {
      console.error('[useSessionCoordinator] Error managing session:', error);
      toast({
        title: "Error",
        description: "Failed to manage chat session",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  }, [isCreatingSession, toast]);

  const handleTemplateChange = useCallback(async (
    template: Template,
    currentSessionId: string | null
  ) => {
    console.log('[useSessionCoordinator] Handling template change:', {
      templateId: template.id,
      sessionId: currentSessionId
    });

    const sessionId = await createOrUpdateSession(currentSessionId, {
      templateId: template.id
    });

    if (sessionId) {
      const queryParams = new URLSearchParams();
      queryParams.set('template', template.id);
      
      const newPath = sessionId ? 
        `/c/${sessionId}?${queryParams.toString()}` : 
        `/?${queryParams.toString()}`;

      console.log('[useSessionCoordinator] Navigating to:', newPath);
      navigate(newPath);
    }
  }, [createOrUpdateSession, navigate]);

  const ensureSession = useCallback(async () => {
    if (isCreatingSession) {
      console.log('[useSessionCoordinator] Session creation in progress');
      return null;
    }

    const templateId = searchParams.get('template');
    console.log('[useSessionCoordinator] Ensuring session exists:', { templateId });

    return await createOrUpdateSession(null, { templateId });
  }, [createOrUpdateSession, isCreatingSession, searchParams]);

  return {
    createOrUpdateSession,
    handleTemplateChange,
    ensureSession,
    isCreatingSession
  };
};