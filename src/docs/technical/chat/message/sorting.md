
# Message Sorting System

## Sort Algorithm
```typescript
const sortMessages = (msgs: Message[]): Message[] => {
  return [...msgs].sort((a, b) => {
    // Primary sort by timestamp
    const timeComparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (timeComparison !== 0) return timeComparison;
    
    // Secondary sort by metadata index
    const aIndex = a.metadata?.sortIndex || 0;
    const bIndex = b.metadata?.sortIndex || 0;
    return aIndex - bIndex;
  });
};
```

## Sorting Criteria
1. Primary Sort: Timestamp
   - Uses `createdAt` field
   - Maintains chronological order
   - Handles ISO date strings

2. Secondary Sort: Sort Index
   - Uses `metadata.sortIndex`
   - Handles simultaneous messages
   - Maintains user/assistant message pairs
   - Defaults to 0 if not specified
