
# Edge Function Processing

## Authentication and Validation
- JWT token verification
- Chat ownership checks
- Input validation

## Context Management
```typescript
{
  recentMessages: [], // Last 10 messages
  olderCount: 0      // Count of messages beyond last 10
}
```

## Constraints
- 10-second timeout
- Memory limits
- Error handling requirements
- Connection management
