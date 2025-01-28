export class StreamHandler {
  private stream: TransformStream;
  private writer: WritableStreamDefaultWriter;

  constructor() {
    this.stream = new TransformStream();
    this.writer = this.stream.writable.getWriter();
  }

  getResponse(headers: Record<string, string> = {}) {
    return new Response(this.stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...headers
      }
    });
  }

  async writeMetadata(data: Record<string, any>) {
    const encoder = new TextEncoder();
    await this.writer.write(
      encoder.encode(`data: ${JSON.stringify({ type: 'metadata', ...data })}\n\n`)
    );
  }

  async writeChunk(content: string) {
    const encoder = new TextEncoder();
    await this.writer.write(
      encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`)
    );
  }

  getWriter() {
    return this.writer;
  }

  async close() {
    await this.writer.close();
  }
}