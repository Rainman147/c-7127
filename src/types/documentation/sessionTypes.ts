import type { Message } from '@/types/message';
import type { ErrorState } from './errorTypes';

export interface ChatSessionState {
  status: ChatSessionStatus;
  templateContext?: TemplateContextStatus;
  patientId?: string;
  messages: Message[];
  error?: ErrorState;
}

export type ChatSessionStatus =
  | 'initializing'
  | 'active'
  | 'error'
  | 'terminated';

export type TemplateContextStatus =
  | 'default'
  | 'selected'
  | 'modified'
  | 'inherited';

export type MessageStatus = 
  | 'draft'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'seen'
  | 'error'
  | 'retrying';