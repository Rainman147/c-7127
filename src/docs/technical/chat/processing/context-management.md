
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
1. Direct Mode (Default)
   - Bypasses context processing
   - Optimized for quick responses
   - Suitable for standalone queries
   - Reduces processing overhead

2. Context Mode (Optional)
   - Full message history integration
   - Template context awareness
   - Patient data inclusion
   - Enhanced response relevance

3. Real-time Updates
   - Context invalidation
   - Cache management
   - State synchronization
   - Error recovery

## Loading State Visualization
1. Thinking Indicator
   - Smooth gradient animation (4s duration)
   - Dot glow effect sequence
   - Responsive design
   - Clear visual feedback

2. State Transitions
   - Seamless animation handling
   - Loading state management
   - Error state visualization
   - Success state feedback
