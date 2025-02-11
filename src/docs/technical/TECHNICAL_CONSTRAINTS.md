
# Technical Constraints and Limitations

## Infrastructure Limits

### Supabase Limitations
- Database: 8GB PostgreSQL database (free tier)
- Storage: 1GB total storage (free tier)
- Edge Functions: 
  - Timeout: 10 seconds maximum execution time
  - Memory: 150MB RAM limit
  - Concurrent invocations: Limited by tier
- Real-time:
  - Maximum of 200 concurrent connections
  - 2MB message size limit
  - Channel limit: 100 channels per client

### File Operations
- Maximum upload size: 50MB per file
- Supported audio formats: WAV, MP3, WebM
- Supported image formats: JPEG, PNG, GIF
- Storage bucket naming: lowercase, no spaces

## API Rate Limits

### OpenAI Integration
- GPT-4o-mini: 1000 requests per minute
- GPT-4o: 500 requests per minute
- Maximum context window: 128,000 tokens
- Maximum response length: 4,096 tokens

### Authentication
- Maximum of 100,000 users
- Rate limit: 60 requests per minute per user
- Session duration: 1 week default
- Password requirements:
  - Minimum 8 characters
  - At least 1 number
  - At least 1 special character

## Performance Guidelines

### Real-time Features
- Message delivery: < 100ms latency
- Subscription sync: < 200ms
- Maximum event payload: 1MB
- Recommended batch size: 100 events

### Database Performance
- Query timeout: 30 seconds
- Maximum connections: 20 per user
- Row limit per query: 1000
- JSON field size: 1GB maximum

### Frontend Performance
- Initial page load: < 3 seconds
- Time to interactive: < 5 seconds
- Memory usage: < 512MB
- LocalStorage limit: 5MB

## Security Constraints

### HIPAA Compliance
- Data encryption: AES-256
- Audit logging required for:
  - All data access
  - Authentication attempts
  - Configuration changes
- Data retention: 7 years minimum

### Data Protection
- TLS 1.2 or higher required
- CORS restrictions: Configurable per origin
- Content Security Policy (CSP) enforced
- Rate limiting on authentication endpoints

## Integration Limitations

### EMR Integration
- Allscripts API:
  - Rate limit: 100 requests per minute
  - Maximum payload size: 5MB
  - Authentication token validity: 1 hour
  - Required fields validation

### Medical Device Data
- Supported formats: HL7, FHIR
- Maximum device connections: 100
- Data freshness: 5 minute maximum delay
- Batch processing limit: 1000 records

## Development Constraints

### Build System
- Node.js version: 18+
- Build time limit: 5 minutes
- Bundle size limit: 2MB (gzipped)
- Environment variables: Must be prefixed with VITE_

### Testing Requirements
- Unit test coverage: > 80%
- E2E test timeout: 30 seconds
- Maximum test suite duration: 10 minutes
- Browser support: Last 2 versions

## Monitoring and Logging
- Log retention: 30 days
- Maximum log size: 100MB per day
- Metrics resolution: 1 minute
- Alert notification delay: < 5 minutes

## Scalability Boundaries
- Maximum concurrent users: 1000
- Database connections: 100
- Cache size: 1GB
- Background jobs: 20 concurrent

## Error Handling
- Retry attempts: 3 maximum
- Backoff strategy: Exponential
- Error reporting rate: 100 errors per minute
- Stack trace limit: 50 frames

## Deployment Constraints
- Zero-downtime updates required
- Rollback time: < 5 minutes
- Configuration changes: No restart required
- Geographic restrictions: Based on data sovereignty

## Maintenance Windows
- Scheduled maintenance: Off-peak hours
- Maximum downtime: 15 minutes
- Update frequency: Weekly
- Backup frequency: Daily
