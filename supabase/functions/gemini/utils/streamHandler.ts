export class StreamHandler {
  private encoder = new TextEncoder();
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private stream: TransformStream;

  constructor() {
    this.stream = new TransformStream();
    this.writer = this.stream.writable.getWriter();
  }

  getResponse(headers: Record<string, string>) {
    return new Response(this.stream.readable, {
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  async writeMetadata(data: Record<string, any>) {
    console.log('[StreamHandler] Writing metadata:', data);
    await this.writeEvent({
      type: 'metadata',
      ...data
    });
  }

  async writeChunk(content: string) {
    console.log('[StreamHandler] Writing chunk:', { 
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });
    
    await this.writeEvent({
      type: 'chunk',
      content
    });
  }

  async writeError(error: any) {
    console.error('[StreamHandler] Writing error:', error);
    await this.writeEvent({
      type: 'error',
      error: error.message || 'Unknown error occurred'
    });
  }

  private async writeEvent(data: any) {
    try {
      const encoded = this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
      await this.writer.write(encoded);
    } catch (error) {
      console.error('[StreamHandler] Failed to write event:', error);
      throw error;
    }
  }

  async close() {
    try {
      await this.writer.close();
      console.log('[StreamHandler] Stream closed successfully');
    } catch (error) {
      console.error('[StreamHandler] Error closing stream:', error);
      throw error;
    }
  }
}