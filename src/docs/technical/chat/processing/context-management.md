
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

## Context Formatting
```typescript
function formatContextualMessage(currentContent, recentMessages, olderCount) {
  let formattedContent = '';
  
  // Add context header
  if (olderCount > 0) {
    formattedContent += `[Context: ${olderCount} previous messages]\n\n`;
  }
  
  // Add recent messages
  formattedContent += recentMessages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
    
  // Add current message
  formattedContent += `\n\nUser: ${currentContent}`;
  
  return formattedContent;
}
```
