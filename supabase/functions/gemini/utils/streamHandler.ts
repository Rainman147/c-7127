import { updateMessageStatus, updateChatTimestamp } from './messageProcessor.ts';

export async function handleStreamingResponse(
  response: Response,
  supabase: any,
  assistantMessageId: string,
  chatId: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder
) {
  const reader = response.body!.getReader();
  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(5);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              
              // Update assistant message in real-time
              await updateMessageStatus(supabase, assistantMessageId, 'processing', fullResponse);

              // Send chunk to client
              await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    }

    // Mark message as delivered
    await updateMessageStatus(supabase, assistantMessageId, 'delivered');
    
    // Update chat timestamp
    await updateChatTimestamp(supabase, chatId);

    console.log('Processing completed successfully', {
      chatId,
      responseLength: fullResponse.length
    });

  } finally {
    await writer.close();
  }
}