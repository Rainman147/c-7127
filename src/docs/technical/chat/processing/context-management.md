
# Context Management

## Context Retrieval Process
```typescript
async function getChatContext(authenticatedClient, chatId) {
  // Get last 10 messages
  const { data: recentMessages } = await authenticatedClient
    .from('messages')
    .select('role, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get older messages count
  const { count } = await authenticatedClient
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('chat_id', chatId)
    .lt('created_at', lastMessage.created_at);

  return {
    recentMessages: recentMessages.reverse(),
    olderCount: count || 0
  };
}
```

## Context Management
1. Message History
   - Recent message retrieval
   - Older message count
   - Pagination support
   - Memory optimization

2. Template Context
   - System instructions
   - Response formatting
   - Schema validation
   - Priority rules

3. Patient Context
   - Medical history
   - Recent interactions
   - Context persistence
   - Privacy management

4. Real-time Updates
   - Context invalidation
   - Cache management
   - State synchronization
   - Error recovery
