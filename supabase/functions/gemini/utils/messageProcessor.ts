import { createAppError } from './errorHandler.ts';

export async function processWithOpenAI(messages: any[], apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw createAppError(
      `OpenAI API error: ${response.status} ${error}`,
      'AI_SERVICE_ERROR'
    );
  }

  return response;
}

export async function updateMessageStatus(supabase: any, messageId: string, status: string, content?: string) {
  const updateData: any = { 
    status,
    ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {})
  };
  
  if (content !== undefined) {
    updateData.content = content;
  }

  const { error: updateError } = await supabase
    .from('messages')
    .update(updateData)
    .eq('id', messageId);

  if (updateError) {
    console.error('Error updating message:', updateError);
    throw createAppError('Error updating message status', 'DATABASE_ERROR');
  }
}

export async function updateChatTimestamp(supabase: any, chatId: string) {
  const { error: chatUpdateError } = await supabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId);

  if (chatUpdateError) {
    console.error('Error updating chat timestamp:', chatUpdateError);
  }
}