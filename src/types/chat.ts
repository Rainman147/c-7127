export type MessageRole = 'user' | 'assistant';
export type MessageType = 'text' | 'audio';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  sequence?: number;
  created_at?: string;
  isStreaming?: boolean;
  isOptimistic?: boolean;
}

export interface ChatInputProps {
  onSend: (message: string, type?: MessageType) => Promise<any>;
  onTranscriptionComplete: (text: string) => void;
  isLoading?: boolean;
}

export interface ChatInputFieldProps {
  message: string;
  setMessage: (message: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  maxLength?: number;
}

export interface ChatInputActionsProps {
  isLoading: boolean;
  message: string;
  handleSubmit: () => void;
  onTranscriptionComplete: (text: string) => void;
  handleFileUpload: (file: File) => void;
}

export interface ChatInputContainerProps {
  onSend: (message: string, type?: MessageType) => Promise<Message>;
  onTranscriptionComplete: (text: string) => void;
  isLoading?: boolean;
}

export interface UseChatInputProps {
  onSend: (message: string, type?: MessageType) => Promise<any>;
  onTranscriptionComplete: (text: string) => void;
  message: string;
  setMessage: (message: string) => void;
}

export interface MessageGroup {
  id: string;
  label: string;
  timestamp: string;
  messages: Message[];
}

export interface MessageUpdate {
  id: string;
  content: string;
  type?: MessageType;
}

export interface MessageAction {
  type: 'edit' | 'delete' | 'regenerate';
  messageId: string;
}

export interface MessageFilter {
  role?: MessageRole;
  type?: MessageType;
  startDate?: Date;
  endDate?: Date;
}