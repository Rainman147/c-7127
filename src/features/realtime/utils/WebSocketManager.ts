import { logger, LogCategory } from '@/utils/logging';
import type { WebSocketError } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class WebSocketManager {
  private channel: RealtimeChannel;
  private onError: (error: WebSocketError) => void;

  constructor(channel: RealtimeChannel, onError: (error: WebSocketError) => void) {
    this.channel = channel;
    this.onError = onError;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.channel.on('error', (error) => {
      logger.error(LogCategory.WEBSOCKET, 'WebSocketManager', 'WebSocket error:', error);
      this.onError({
        name: 'WebSocketError',
        message: error.message,
        timestamp: new Date().toISOString(),
        connectionState: 'error',
        retryCount: 0,
        lastAttempt: Date.now(),
        backoffDelay: 1000,
      });
    });
  }

  public cleanup() {
    this.channel.unsubscribe();
  }
}

export const useWebSocketManager = (
  channel: RealtimeChannel | undefined,
  onError: (error: WebSocketError) => void
) => {
  return {
    lastPingTime: Date.now(),
    reconnectAttempts: 0
  };
};