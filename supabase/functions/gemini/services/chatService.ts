import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createAppError } from '../utils/errorHandler.ts';

export class ChatService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getOrCreateChat(userId: string, chatId: string | null, title: string, templateId?: string) {
    console.log('[ChatService] Getting or creating chat:', { userId, chatId, title, templateId });
    
    try {
      // If chatId provided, verify ownership and return
      if (chatId) {
        const { data: chat, error } = await this.supabase
          .from('chats')
          .select('id, title, template_id, patient_id')
          .eq('id', chatId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        
        if (!chat) {
          throw createAppError('Chat not found or access denied', 'CHAT_ERROR');
        }

        console.log('[ChatService] Found existing chat:', chat);
        return chat;
      }

      // Create new chat with template_id if provided
      const chatData = {
        user_id: userId,
        title: title.substring(0, 50), // Limit title length
        template_id: templateId || null // Use template_id if provided
      };

      const { data: newChat, error: createError } = await this.supabase
        .from('chats')
        .insert(chatData)
        .select()
        .single();

      if (createError) {
        console.error('[ChatService] Error creating chat:', createError);
        throw createAppError('Failed to create chat', 'DATABASE_ERROR');
      }

      console.log('[ChatService] Created new chat:', newChat);
      return newChat;
    } catch (error) {
      console.error('[ChatService] Error in getOrCreateChat:', error);
      throw error;
    }
  }

  async updateChatMetadata(chatId: string, updates: { 
    template_id?: string;
    patient_id?: string | null;
    title?: string;
  }) {
    console.log('[ChatService] Updating chat metadata:', { chatId, updates });

    try {
      const { error } = await this.supabase
        .from('chats')
        .update(updates)
        .eq('id', chatId);

      if (error) {
        console.error('[ChatService] Error updating chat:', error);
        throw createAppError('Failed to update chat metadata', 'DATABASE_ERROR');
      }
    } catch (error) {
      console.error('[ChatService] Error in updateChatMetadata:', error);
      throw error;
    }
  }

  async validateChatAccess(userId: string, chatId: string) {
    console.log('[ChatService] Validating chat access:', { userId, chatId });

    try {
      const { data: chat, error } = await this.supabase
        .from('chats')
        .select('id')
        .eq('id', chatId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!chat) {
        throw createAppError('Chat access denied', 'AUTH_ERROR');
      }

      return true;
    } catch (error) {
      console.error('[ChatService] Error validating chat access:', error);
      throw error;
    }
  }
}