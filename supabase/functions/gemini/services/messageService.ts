import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createAppError } from '../utils/errorHandler.ts';
import type { MessageMetadata } from '../types.ts';

export class MessageService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveUserMessage(chatId: string, content: string, type: 'text' | 'audio' = 'text') {
    console.log('[MessageService] Saving user message:', { chatId, contentLength: content.length, type });
    
    try {
      const { data: message, error } = await this.supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content,
          role: 'user',
          type,
          status: 'delivered'
        })
        .select()
        .single();

      if (error) {
        console.error('[MessageService] Error saving user message:', error);
        throw createAppError('Failed to save user message', 'DATABASE_ERROR');
      }

      console.log('[MessageService] User message saved successfully:', message);
      return message;
    } catch (error) {
      console.error('[MessageService] Error in saveUserMessage:', error);
      throw error;
    }
  }

  async saveAssistantMessage(chatId: string, content: string = '') {
    console.log('[MessageService] Creating assistant message:', { chatId });
    
    try {
      const { data: message, error } = await this.supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content,
          role: 'assistant',
          type: 'text',
          status: 'processing'
        })
        .select()
        .single();

      if (error) {
        console.error('[MessageService] Error creating assistant message:', error);
        throw createAppError('Failed to create assistant message', 'DATABASE_ERROR');
      }

      console.log('[MessageService] Assistant message created:', message);
      return message;
    } catch (error) {
      console.error('[MessageService] Error in saveAssistantMessage:', error);
      throw error;
    }
  }

  async updateMessageStatus(messageId: string, status: 'delivered' | 'failed', content?: string) {
    console.log('[MessageService] Updating message status:', { messageId, status });
    
    try {
      const updates: MessageMetadata & { content?: string } = {
        status,
        type: 'text'
      };

      if (content !== undefined) {
        updates.content = content;
      }

      const { error } = await this.supabase
        .from('messages')
        .update(updates)
        .eq('id', messageId);

      if (error) {
        console.error('[MessageService] Error updating message status:', error);
        throw createAppError('Failed to update message status', 'DATABASE_ERROR');
      }

      console.log('[MessageService] Message status updated successfully');
    } catch (error) {
      console.error('[MessageService] Error in updateMessageStatus:', error);
      throw error;
    }
  }

  async getRecentMessages(chatId: string, limit = 10) {
    console.log('[MessageService] Fetching recent messages:', { chatId, limit });
    
    try {
      const { data: messages, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('[MessageService] Error fetching messages:', error);
        throw createAppError('Failed to fetch messages', 'DATABASE_ERROR');
      }

      console.log('[MessageService] Fetched messages:', messages?.length);
      return messages || [];
    } catch (error) {
      console.error('[MessageService] Error in getRecentMessages:', error);
      throw error;
    }
  }
}