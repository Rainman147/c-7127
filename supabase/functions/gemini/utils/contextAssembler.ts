import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ChatContext } from '../types.ts';
import { formatPatientContext } from './formatters.ts';

export async function assembleContext(supabase: any, chatId: string): Promise<ChatContext> {
  console.log('[contextAssembler] Assembling context for chat:', chatId);
  
  // Get chat details with template and patient info in a single query
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select(`
      *,
      templates!chats_template_type_fkey (
        system_instructions
      ),
      patients!chats_patient_id_fkey (
        name,
        dob,
        medical_history,
        current_medications
      )
    `)
    .eq('id', chatId)
    .maybeSingle();

  if (chatError) {
    console.error('[contextAssembler] Error fetching chat:', chatError);
    throw new Error('Failed to fetch chat details');
  }

  // Get message history (last 3 messages for context)
  const { data: messages = [], error: messagesError } = await supabase
    .from('messages')
    .select('content, sender, type, sequence')
    .eq('chat_id', chatId)
    .order('sequence', { ascending: true })
    .limit(3);

  if (messagesError) {
    console.error('[contextAssembler] Error fetching messages:', messagesError);
    throw new Error('Failed to fetch message history');
  }

  const messageHistory = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content,
    type: msg.type,
    sequence: msg.sequence
  }));

  // Format patient context if available
  const patientContext = chat?.patients ? formatPatientContext(chat.patients) : null;

  console.log('[contextAssembler] Context assembly complete:', {
    hasTemplateInstructions: !!chat?.templates?.system_instructions,
    hasPatientContext: !!patientContext,
    messageCount: messageHistory.length
  });

  return {
    templateInstructions: chat?.templates?.system_instructions || 'Process conversation using standard medical documentation format.',
    patientContext,
    messageHistory
  };
}