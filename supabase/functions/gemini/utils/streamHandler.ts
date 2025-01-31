/**
 * Handles server-sent events (SSE) streaming for the Gemini edge function.
 * Manages stream initialization, writing chunks, and proper closure.
 */
export class StreamHandler {
  private stream: TransformStream;
  private writer: WritableStreamDefaultWriter;

  constructor() {
    console.log('[StreamHandler] Initializing new stream');
    this.stream = new TransformStream();
    this.writer = this.stream.writable.getWriter();
  }

  /**
   * Returns a properly configured streaming response with SSE headers
   */
  getResponse(headers: Record<string, string> = {}) {
    console.log('[StreamHandler] Creating response with headers');
    return new Response(this.stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...headers
      }
    });
  }

  /**
   * Writes metadata information at the start of the stream
   */
  async writeMetadata(data: Record<string, any>) {
    console.log('[StreamHandler] Writing metadata:', data);
    const encoder = new TextEncoder();
    await this.writer.write(
      encoder.encode(`data: ${JSON.stringify({ type: 'metadata', ...data })}\n\n`)
    );
  }

  /**
   * Writes a content chunk to the stream
   */
  async writeChunk(content: string) {
    console.log('[StreamHandler] Writing chunk:', { contentLength: content.length });
    const encoder = new TextEncoder();
    await this.writer.write(
      encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`)
    );
  }

  /**
   * Returns the stream writer for direct access if needed
   */
  getWriter() {
    return this.writer;
  }

  /**
   * Properly closes the stream
   */
  async close() {
    console.log('[StreamHandler] Closing stream');
    await this.writer.close();
  }
}