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

  getWriter() {
    return this.writer;
  }

  async close() {
    await this.writer.close();
  }
}