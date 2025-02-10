
# API Specifications

## Core APIs

### Patient Context API
#### Endpoints
1. **Patient Information**
   ```typescript
   GET /api/patients/:id
   GET /api/patients/:id/history
   GET /api/patients/:id/vitals
   POST /api/patients/:id/vitals
   ```

2. **Visit Management**
   ```typescript
   GET /api/patients/:id/visits
   POST /api/patients/:id/visits
   PUT /api/patients/:id/visits/:visitId
   ```

### Documentation API
#### Endpoints
1. **Note Management**
   ```typescript
   POST /api/notes
   GET /api/notes/:id
   PUT /api/notes/:id
   ```

2. **Template Management**
   ```typescript
   GET /api/templates
   POST /api/templates
   PUT /api/templates/:id
   ```

## Implementation Details

### Error Handling
All APIs should follow the standard error response format:
```typescript
{
  code: string;
  message: string;
  details?: Record<string, any>;
}
```

### Authentication
- All endpoints require authentication
- Use Supabase JWT tokens
- Implement role-based access control

### Rate Limiting
- Implement per-user rate limiting
- Define specific limits for resource-intensive operations
- Use Supabase edge functions for complex operations

## Security Considerations
- All endpoints must validate input
- Implement proper CORS policies
- Use HTTPS only
- Follow security best practices as defined in [SECURITY_FRAMEWORK.md](./SECURITY_FRAMEWORK.md)
