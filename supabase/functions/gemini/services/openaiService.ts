export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async streamCompletion(messages: any[], onChunk: (chunk: string) => Promise<void>): Promise<string> {
    console.log('[OpenAIService] Starting stream completion with:', {
      messageCount: messages.length,
      time: new Date().toISOString()
    });

    let fullResponse = '';

    try {
      console.log('[OpenAIService] Making OpenAI API request');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: true
        })
      });

      if (!response.ok) {
        console.error('[OpenAIService] OpenAI API error:', {
          status: response.status,
          statusText: response.statusText,
          time: new Date().toISOString()
        });
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      console.log('[OpenAIService] Successfully connected to OpenAI stream');
      const reader = response.body!.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[OpenAIService] Stream completed');
          break;
        }

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (data === '[DONE]') {
              console.log('[OpenAIService] Received [DONE] signal');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                console.log('[OpenAIService] Processing chunk:', {
                  chunkLength: content.length,
                  preview: content.substring(0, 50),
                  time: new Date().toISOString()
                });
                await onChunk(content);
              }
            } catch (e) {
              console.error('[OpenAIService] Error parsing chunk:', {
                error: e,
                line,
                time: new Date().toISOString()
              });
            }
          }
        }
      }

      console.log('[OpenAIService] Stream completed successfully:', {
        totalLength: fullResponse.length,
        time: new Date().toISOString()
      });

      return fullResponse;
    } catch (error) {
      console.error('[OpenAIService] Stream error:', {
        error,
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      });
      throw error;
    }
  }
}