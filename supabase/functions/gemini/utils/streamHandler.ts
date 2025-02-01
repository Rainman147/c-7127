export class StreamHandler {
  private encoder = new TextEncoder();
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private stream: TransformStream;
  private isStreamClosed = false;

  constructor() {
    console.log('[StreamHandler] Initializing');
    this.stream = new TransformStream();
    this.writer = this.stream.writable.getWriter();
  }

  getResponse(headers: Record<string, string>) {
    console.log('[StreamHandler] Creating response with headers:', headers);
    return new Response(this.stream.readable, {
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
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
    if (this.isStreamClosed) {
      console.warn('[StreamHandler] Attempted to write to closed stream');
      return;
    }

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
    if (this.isStreamClosed) {
      console.warn('[StreamHandler] Attempted to write error to closed stream');
      return;
    }

    console.error('[StreamHandler] Writing error:', error);
    
    try {
      await this.writeEvent({
        type: 'error',
        error: error.message || 'Unknown error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
    } catch (writeError) {
      console.error('[StreamHandler] Failed to write error event:', writeError);
    }
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
      if (this.isStreamClosed) {
        console.warn('[StreamHandler] Stream already closed');
        return;
      }

      this.isStreamClosed = true;
      await this.writer.close();
      console.log('[StreamHandler] Stream closed successfully');
    } catch (error) {
      console.error('[StreamHandler] Error closing stream:', error);
      throw error;
    }
  }
}