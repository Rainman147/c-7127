import type { Message } from './chat';

export interface MessageGroup {
  id: string;
  label: string;
  timestamp: string;
  messages: Message[];
}