import { RealtimeClient } from '@supabase/supabase-js';
import { WebSocketError, ConnectionState } from '../types';
import { logger, LogCategory } from '@/utils/logging';

export class WebSocketManager {
  private client: RealtimeClient;
  private onStateChange: (state: ConnectionState) => void;

  constructor(
    client: RealtimeClient,
    onStateChange: (state: ConnectionState) => void
  ) {
    this.client = client;
    this.onStateChange = onStateChange;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connected', () => {
      logger.debug(LogCategory.STATE, 'WebSocketManager', 'WebSocket connected');
      this.onStateChange({ status: 'connected' });
    });

    this.client.on('disconnected', () => {
      logger.debug(LogCategory.STATE, 'WebSocketManager', 'WebSocket disconnected');
      this.onStateChange({ status: 'disconnected' });
    });

    this.client.on('error', (error: WebSocketError) => {
      logger.error(LogCategory.STATE, 'WebSocketManager', 'WebSocket error:', error);
      this.onStateChange({
        status: 'error',
        error: {
          code: error.code || 500,
          message: error.message || 'Unknown error',
          status: error.status || 500
        }
      });
    });
  }

  public connect() {
    try {
      this.client.connect();
      logger.debug(LogCategory.STATE, 'WebSocketManager', 'Initiating WebSocket connection');
    } catch (error) {
      logger.error(LogCategory.STATE, 'WebSocketManager', 'Error connecting WebSocket:', error);
    }
  }

  public disconnect() {
    try {
      this.client.disconnect();
      logger.debug(LogCategory.STATE, 'WebSocketManager', 'Disconnecting WebSocket');
    } catch (error) {
      logger.error(LogCategory.STATE, 'WebSocketManager', 'Error disconnecting WebSocket:', error);
    }
  }
}