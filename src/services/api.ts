import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';

export const api = {
  chat: {
    async createSession(userId: string, title: string) {
      try {
        const { data, error } = await supabase
          .from('chats')
          .insert([{ user_id: userId, title }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        logger.error(LogCategory.API, 'createSession', 'Failed to create chat session:', error);
        throw error;
      }
    },

    async getMessages(chatId: string) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
      } catch (error) {
        logger.error(LogCategory.API, 'getMessages', 'Failed to fetch messages:', error);
        throw error;
      }
    },
  },

  templates: {
    async getTemplates(userId: string) {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        return data;
      } catch (error) {
        logger.error(LogCategory.API, 'getTemplates', 'Failed to fetch templates:', error);
        throw error;
      }
    },
  },
};