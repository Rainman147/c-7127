export class StreamHandler {
  private encoder = new TextEncoder();
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private stream: TransformStream;
  private isStreamClosed = false;
  private lastChunkTime: number;
  private chunkCount = 0;

  constructor() {
    console.log('[StreamHandler] Initializing');
    this.stream = new TransformStream();
    this.writer = this.stream.writable.getWriter();
    this.lastChunkTime = Date.now();
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
    if (this.isStreamClosed) {
      console.warn('[StreamHandler] Attempted to write metadata to closed stream');
      return;
    }

    console.log('[StreamHandler] Writing metadata:', {
      ...data,
      timestamp: new Date().toISOString()
    });

    try {
      await this.writeEvent({
        type: 'metadata',
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[StreamHandler] Failed to write metadata:', error);
      throw error;
    }
  }

  async writeChunk(content: string) {
    if (this.isStreamClosed) {
      console.warn('[StreamHandler] Attempted to write to closed stream');
      return;
    }

    const now = Date.now();
    const timeSinceLastChunk = now - this.lastChunkTime;
    this.lastChunkTime = now;
    this.chunkCount++;

    console.log('[StreamHandler] Writing chunk:', { 
      chunkNumber: this.chunkCount,
      contentLength: content.length,
      timeSinceLastChunk,
      preview: content.substring(0, 30),
      timestamp: new Date().toISOString()
    });
    
    try {
      await this.writeEvent({
        type: 'chunk',
        content,
        chunkNumber: this.chunkCount
      });
      await this.writer.ready; // Ensures chunk is flushed
    } catch (error) {
      console.error('[StreamHandler] Error writing chunk:', {
        error,
        chunkNumber: this.chunkCount,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async writeError(error: any) {
    if (this.isStreamClosed) {
      console.warn('[StreamHandler] Attempted to write error to closed stream');
      return;
    }

    console.error('[StreamHandler] Writing error:', {
      error,
      timestamp: new Date().toISOString()
    });
    
    try {
      await this.writeEvent({
        type: 'error',
        error: error.message || 'Unknown error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        retryable: error.retryable || false,
        timestamp: new Date().toISOString(),
        chunkCount: this.chunkCount
      });
    } catch (writeError) {
      console.error('[StreamHandler] Failed to write error event:', {
        writeError,
        originalError: error,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async writeEvent(data: any) {
    try {
      const encoded = this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
      await this.writer.write(encoded);
    } catch (error) {
      console.error('[StreamHandler] Failed to write event:', {
        error,
        eventType: data.type,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async close() {
    try {
      if (this.isStreamClosed) {
        console.warn('[StreamHandler] Stream already closed');
        return;
      }

      console.log('[StreamHandler] Closing stream:', {
        totalChunks: this.chunkCount,
        timestamp: new Date().toISOString()
      });

      this.isStreamClosed = true;
      await this.writer.close();
    } catch (error) {
      console.error('[StreamHandler] Error closing stream:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}