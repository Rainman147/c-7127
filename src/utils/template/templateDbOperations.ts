import { supabase } from "@/integrations/supabase/client";
import type { Template } from '@/components/template/templateTypes';

export const loadTemplateFromDb = async (chatId: string) => {
  console.log('[templateDbOperations] Loading template for chat:', chatId);
  const { data, error } = await supabase
    .from('chats')
    .select('template_type')
    .eq('id', chatId)
    .maybeSingle();

  if (error) {
    console.error('[templateDbOperations] Error loading template:', error);
    throw error;
  }

  return data?.template_type;
};

export const saveTemplateToDb = async (chatId: string, templateId: string) => {
  console.log('[templateDbOperations] Saving template to database:', {
    chatId,
    templateId
  });
  
  const { error } = await supabase
    .from('chats')
    .update({ template_type: templateId })
    .eq('id', chatId);

  if (error) {
    console.error('[templateDbOperations] Error saving template:', error);
    throw error;
  }
};
