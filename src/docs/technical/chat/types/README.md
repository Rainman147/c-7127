
# Chat System Types

## Message Types
```typescript
type MessageRole = 'user' | 'assistant' | 'system';
type MessageType = 'text' | 'audio' | 'image';

interface MessageMetadata {
  isFirstMessage?: boolean;
  transcriptionId?: string;
  processingDuration?: number;
  editedAt?: string;
  originalContent?: string;
  tempId?: string;
  isOptimistic?: boolean;
  retryCount?: number;
  sortIndex?: number;
}

interface Message {
  id?: string;
  chatId: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  metadata?: MessageMetadata;
  createdAt: string;
  status?: 'delivered' | 'pending' | 'error';
}
```

## Session Types
```typescript
interface ChatSession {
  id?: string;
  messages: Message[];
  templateId?: string;
  patientId?: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  userId: string;
}

interface ChatContext {
  sessionId: string;
  templateId?: string;
  patientId?: string;
  messages: Message[];
}
```
