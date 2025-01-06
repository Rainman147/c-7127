import { supabase } from "@/integrations/supabase/client";
import type { Template } from "../../components/template/types";

export const loadTemplateFromDb = async (chatId: string) => {
  console.log('[templateDbOperations] Loading template for chat:', chatId);
  
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      console.error('[templateDbOperations] No active session');
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('chats')
      .select('template_type, user_id')
      .eq('id', chatId)
      .maybeSingle();

    if (error) {
      console.error('[templateDbOperations] Error loading template:', error);
      throw error;
    }

    if (!data) {
      console.error('[templateDbOperations] Chat not found:', chatId);
      throw new Error('Chat not found');
    }

    // Verify ownership
    if (data.user_id !== session.session.user.id) {
      console.error('[templateDbOperations] User does not have access to this chat');
      throw new Error('Access denied');
    }

    console.log('[templateDbOperations] Successfully loaded template:', data.template_type);
    return data.template_type;
  } catch (error) {
    console.error('[templateDbOperations] Failed to load template:', error);
    throw error;
  }
};

export const saveTemplateToDb = async (chatId: string, templateId: string) => {
  console.log('[templateDbOperations] Saving template to database:', {
    chatId,
    templateId
  });
  
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('chats')
      .update({ template_type: templateId })
      .eq('id', chatId)
      .eq('user_id', session.session.user.id);

    if (error) {
      console.error('[templateDbOperations] Error saving template:', error);
      throw error;
    }
  } catch (error) {
    console.error('[templateDbOperations] Error saving template:', error);
    throw error;
  }
};