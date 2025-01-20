import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Message } from '../types.ts';

export class MessageService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveUserMessage(chatId: string, content: string, type: 'text' | 'audio' = 'text') {
    console.log('[MessageService] Saving user message:', { chatId, contentLength: content.length, type });
    
    const { data: messages, error: seqError } = await this.supabase
      .from('messages')
      .select('sequence')
      .eq('chat_id', chatId)
      .order('sequence', { ascending: false })
      .limit(1);

    if (seqError) {
      console.error('[MessageService] Error getting sequence:', seqError);
      throw seqError;
    }

    const sequence = (messages?.[0]?.sequence || 0) + 1;
    
    const { data: message, error: saveError } = await this.supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content,
        sender: 'user',
        type,
        sequence,
        status: 'sending'
      })
      .select()
      .single();

    if (saveError) {
      console.error('[MessageService] Error saving message:', saveError);
      throw saveError;
    }

    return message;
  }

  async saveAssistantMessage(chatId: string, content: string = '') {
    const { data: message, error } = await this.supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content,
        sender: 'assistant',
        type: 'text',
        status: 'processing'
      })
      .select()
      .single();

    if (error) {
      console.error('[MessageService] Error saving assistant message:', error);
      throw error;
    }

    return message;
  }

  async updateMessageStatus(messageId: string, status: 'delivered' | 'failed', content?: string) {
    const updateData: any = {
      status,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null
    };

    if (content !== undefined) {
      updateData.content = content;
    }

    const { error } = await this.supabase
      .from('messages')
      .update(updateData)
      .eq('id', messageId);

    if (error) {
      console.error('[MessageService] Error updating message status:', error);
      throw error;
    }
  }

  async updateChatTimestamp(chatId: string) {
    const { error } = await this.supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    if (error) {
      console.error('[MessageService] Error updating chat timestamp:', error);
      throw error;
    }
  }
}