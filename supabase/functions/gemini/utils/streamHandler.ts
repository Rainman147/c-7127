import { MessageQueue } from './messageQueue.ts';

interface StreamMessage {
  type: 'metadata' | 'chunk' | 'error';
  content?: string;
  chatId?: string;
  error?: string;
}

export class StreamHandler {
  private encoder: TextEncoder;
  private streamController: ReadableStreamDefaultController | null = null;
  private stream: ReadableStream;
  private messageQueue: MessageQueue<StreamMessage>;

  constructor() {
    this.encoder = new TextEncoder();
    this.messageQueue = new MessageQueue<StreamMessage>();
    
    this.stream = new ReadableStream({
      start: (controller) => {
        this.streamController = controller;
        console.log("[StreamHandler] Stream initialized successfully");
      },
      cancel: () => {
        console.log("[StreamHandler] Stream cancelled by client");
        this.cleanup();
      }
    });
  }

  private validateStreamState(): boolean {
    if (!this.streamController) {
      console.error("[StreamHandler] Stream controller not initialized");
      return false;
    }
    return true;
  }

  private async processMessage(message: StreamMessage): Promise<void> {
    if (!this.validateStreamState()) {
      return;
    }

    try {
      const encodedMessage = this.encoder.encode(
        `data: ${JSON.stringify(message)}\n\n`
      );
      
      this.streamController!.enqueue(encodedMessage);
      console.log(`[StreamHandler] Message processed: ${message.type}`);
      
    } catch (error) {
      console.error(`[StreamHandler] Error processing message:`, error);
      await this.writeError("Failed to process message");
    }
  }

  getResponse(headers: Record<string, string>): Response {
    console.log("[StreamHandler] Creating SSE response");
    return new Response(this.stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...headers,
      },
    });
  }

  async writeMetadata(metadata: { chatId: string }): Promise<void> {
    if (!metadata.chatId) {
      console.error("[StreamHandler] Invalid metadata: missing chatId");
      return;
    }

    console.log("[StreamHandler] Writing metadata:", metadata);
    await this.processMessage({
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
    await this.processMessage({
      type: 'chunk',
      content
    });
  }

  async writeError(error: string): Promise<void> {
    console.error("[StreamHandler] Writing error:", error);
    await this.processMessage({
      type: 'error',
      error
    });
  }

  private cleanup(): void {
    console.log("[StreamHandler] Cleaning up resources");
    this.messageQueue.clear();
  }

  async close(): Promise<void> {
    console.log("[StreamHandler] Closing stream");
    if (this.validateStreamState()) {
      try {
        this.streamController!.close();
        this.cleanup();
      } catch (error) {
        console.error("[StreamHandler] Error closing stream:", error);
      }
    }
  }
}