
# State Management Documentation

## Message Pipeline State
1. Message Preparation (`useMessageSender.ts`)
   ```typescript
   {
     chatId: sessionId,
     content,
     type: 'text' | 'audio',
     role: 'user',
     status: 'pending',
     metadata: {
       tempId,
       isOptimistic: true,
       sortIndex: messages.length
     }
   }
   ```

2. Optimistic Updates
   - Immediate UI feedback
   - Temporary ID assignment
   - Status tracking
   - Sort index management

## Context State Management
- Recent messages tracking
- Older message counts
- Loading states
- Error states
