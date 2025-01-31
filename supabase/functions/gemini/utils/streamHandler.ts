import { MessageQueue } from './messageQueue';

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
  private isProcessing: boolean = false;
  private maxRetries: number = 3;
  private timeout: number = 30000; // 30 seconds

  constructor() {
    this.encoder = new TextEncoder();
    this.messageQueue = new MessageQueue<StreamMessage>();
    
    this.stream = new ReadableStream({
      start: (controller) => {
        this.streamController = controller;
        console.log("[StreamHandler] ✅ Stream initialized");
        this.startMessageProcessing();
      },
      cancel: () => {
        console.log("[StreamHandler] ❌ Stream cancelled by client");
        this.cleanup();
      }
    });
  }

  private validateStreamState(): boolean {
    if (!this.streamController) {
      console.error("[StreamHandler] ❌ Stream controller not initialized");
      return false;
    }
    return true;
  }

  private async startMessageProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log("[StreamHandler] 🔄 Starting message processing");
    
    while (!this.messageQueue.isEmpty() && this.validateStreamState()) {
      const message = this.messageQueue.dequeue();
      if (message) {
        await this.processMessage(message);
      }
    }
    
    this.isProcessing = false;
  }

  private async processMessage(message: StreamMessage, retryCount: number = 0): Promise<void> {
    try {
      const encodedMessage = this.encoder.encode(
        `data: ${JSON.stringify(message)}\n\n`
      );
      
      const writePromise = new Promise<void>((resolve, reject) => {
        if (!this.streamController) {
          reject(new Error("Stream controller not initialized"));
          return;
        }
        
        try {
          this.streamController.enqueue(encodedMessage);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      await Promise.race([
        writePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Write timeout")), this.timeout)
        )
      ]);

      console.log(`[StreamHandler] ✅ Message processed: ${message.type}`);
      
    } catch (error) {
      console.error(`[StreamHandler] ❌ Error processing message:`, error);
      
      if (retryCount < this.maxRetries) {
        console.log(`[StreamHandler] 🔄 Retrying message (${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        await this.processMessage(message, retryCount + 1);
      } else {
        console.error(`[StreamHandler] ❌ Max retries reached for message`);
        await this.writeError("Failed to process message after multiple retries");
      }
    }
  }

  getResponse(headers: Record<string, string>): Response {
    console.log("[StreamHandler] 🔗 Creating SSE response");
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
    console.log("[StreamHandler] 📝 Queueing metadata:", metadata);
    this.messageQueue.enqueue({
      type: 'metadata',
      chatId: metadata.chatId
    });
    this.startMessageProcessing();
  }

  async writeChunk(content: string): Promise<void> {
    if (!content) {
      console.warn("[StreamHandler] ⚠️ Attempted to write empty chunk");
      return;
    }
    
    console.log("[StreamHandler] 📝 Queueing chunk");
    this.messageQueue.enqueue({
      type: 'chunk',
      content
    });
    this.startMessageProcessing();
  }

  async writeError(error: string): Promise<void> {
    console.error("[StreamHandler] ❌ Writing error:", error);
    this.messageQueue.enqueue({
      type: 'error',
      error
    });
    this.startMessageProcessing();
  }

  private cleanup(): void {
    console.log("[StreamHandler] 🧹 Cleaning up resources");
    this.messageQueue.clear();
    this.isProcessing = false;
  }

  async close(): Promise<void> {
    console.log("[StreamHandler] 🔚 Closing stream");
    await this.processRemainingMessages();
    if (this.streamController) {
      this.streamController.close();
    }
    this.cleanup();
  }

  private async processRemainingMessages(): Promise<void> {
    console.log("[StreamHandler] 🔄 Processing remaining messages");
    while (!this.messageQueue.isEmpty()) {
      await this.startMessageProcessing();
    }
  }
}