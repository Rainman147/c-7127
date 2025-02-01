import { MessageQueue } from './messageQueue.ts';

interface StreamMessage {
  type: 'metadata' | 'chunk' | 'error';
  content?: string;
  chatId?: string;
  error?: string;
}

export class StreamHandler {
  private encoder: TextEncoder;
  private streamController: TransformStream;
  private writer: WritableStreamDefaultWriter;

  constructor() {
    this.encoder = new TextEncoder();
    this.streamController = new TransformStream();
    this.writer = this.streamController.writable.getWriter();
    console.log("[StreamHandler] Stream initialized with SSE configuration");
  }

  getResponse(headers: Record<string, string>): Response {
    console.log("[StreamHandler] Creating SSE response");
    return new Response(this.streamController.readable, {
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  async writeMetadata(metadata: { chatId: string }): Promise<void> {
    if (!metadata.chatId) {
      console.error("[StreamHandler] Invalid metadata: missing chatId");
      return;
    }

    console.log("[StreamHandler] Writing metadata:", metadata);
    await this.writeEvent({
      type: 'metadata',
      chatId: metadata.chatId
    });
  }

  async writeChunk(content: string): Promise<void> {
    if (!content) {
      console.warn("[StreamHandler] Attempted to write empty chunk");
      return;
    }
    
    console.log("[StreamHandler] Writing chunk");
    await this.writeEvent({
      type: 'chunk',
      content
    });
  }

  async writeError(error: string): Promise<void> {
    console.error("[StreamHandler] Writing error:", error);
    await this.writeEvent({
      type: 'error',
      error
    });
  }

  private async writeEvent(data: StreamMessage): Promise<void> {
    try {
      const encoded = this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
      await this.writer.write(encoded);
      console.log(`[StreamHandler] Event written: ${data.type}`);
    } catch (error) {
      console.error("[StreamHandler] Error writing event:", error);
    }
  }

  async close(): Promise<void> {
    console.log("[StreamHandler] Closing stream");
    try {
      await this.writer.close();
    } catch (error) {
      console.error("[StreamHandler] Error closing stream:", error);
    }
  }
}