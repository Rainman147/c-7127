export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async streamCompletion(messages: any[], onChunk: (chunk: string) => Promise<void>): Promise<string> {
    console.log('[OpenAIService] Starting stream completion');
    let fullResponse = '';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const reader = response.body!.getReader();

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
                await onChunk(content);
              }
            } catch (e) {
              console.error('[OpenAIService] Error parsing chunk:', e);
            }
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('[OpenAIService] Stream error:', error);
      throw error;
    }
  }
}