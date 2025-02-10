# Type and Naming Conventions

This document outlines the standardized naming and type conventions for our application. For product requirements and feature specifications, please refer to [PRD.md](./PRD.md).

## Layer-Specific Conventions

### Database Layer (snake_case)
- Table names: `patients`, `templates`, `messages`
- Column names: `medical_history`, `created_at`, `updated_at`
- Foreign keys: `user_id`, `patient_id`, `template_id`
- JSON fields: `contact_info`, `current_medications`

### Frontend Layer (camelCase)
- Props/State: `userId`, `patientId`, `medicalHistory`
- Event handlers: `onPatientSelect`, `handleTemplateChange`
- Component names: `PatientSelector`, `TemplateList`
- URL parameters: `/chat?patientId=123`

## Type Definitions

### Database Types (src/types/database/index.ts)
```typescript
// Always prefix with 'Db'
export type DbPatient = Database['public']['Tables']['patients']['Row'];
export type DbTemplate = Database['public']['Tables']['templates']['Row'];
export type DbMessage = Database['public']['Tables']['messages']['Row'];

// Export enum types from database
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'audio';
```

### Frontend Types (src/types/[entity].ts)
```typescript
// No prefix, focused on UI needs
interface Patient {
  id: string;
  name: string;
  medicalHistory: string;
  userId: string;
  // ... other fields
}

// Always export types and enums
export interface Message {
  id?: string;
  chatId: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  metadata?: Record<string, any>;
  createdAt?: string;
}
```

### Conversion Layer (src/utils/transforms/[entity].ts)
```typescript
// Database → Frontend
const toFrontendPatient = (dbPatient: DbPatient): Patient => ({
  id: dbPatient.id,
  name: dbPatient.name,
  medicalHistory: dbPatient.medical_history,
  userId: dbPatient.user_id
});

// Frontend → Database
const toDatabasePatient = (patient: Patient): DbPatient => ({
  id: patient.id,
  name: patient.name,
  medical_history: patient.medicalHistory,
  user_id: patient.userId
});
```

## Development Workflow

### 1. Adding New Features
1. Start with database schema changes if needed
2. Update `src/types/database/index.ts` to reflect schema
3. Create/update frontend types in `src/types/[entity].ts`
4. Implement conversion utilities in `src/utils/transforms/[entity].ts`
5. Create/update components using frontend types
6. Add edge functions using conversion utilities

### 2. Making Schema Changes
1. Create migration using the migration tool
2. Update database types immediately
3. Update all affected frontend types
4. Update conversion utilities
5. Test data flow end-to-end

### 3. Component Development
1. Use PascalCase for component names
2. Create new components in separate files
3. Use TypeScript interfaces for props
4. Import and use frontend types only
5. Use conversion utilities for API calls

## Best Practices

### 1. Type Safety
- Enable strict TypeScript checks
- No `any` types except in specific cases
- Validate data at boundaries
- Use type guards when needed
- Export all types and enums

### 2. Naming Conventions
- Database: snake_case
  ```sql
  table_name, column_name, user_id
  ```
- Frontend: camelCase
  ```typescript
  userId, handleClick, getData
  ```
- Components: PascalCase
  ```typescript
  PatientList, TemplateSelector
  ```
- Types/Interfaces: PascalCase
  ```typescript
  interface UserProfile, type MessageType
  ```
- Constants: UPPER_SNAKE_CASE
  ```typescript
  MAX_RETRIES, API_ENDPOINT
  ```

### 3. File Organization
```
src/
├── types/
│   ├── database/    # Database types
│   ├── patient.ts   # Frontend types
│   └── chat.ts      # Frontend types
├── utils/
│   └── transforms/  # Conversion utilities
└── components/      # React components
```

### 4. Edge Functions
1. Accept camelCase parameters
2. Use conversion utilities
3. Return camelCase responses
4. Include type definitions
5. Add error handling

### 5. JSON/Database Fields
- Database
  ```sql
  contact_info jsonb,
  medical_history text,
  created_at timestamptz
  ```
- Frontend
  ```typescript
  contactInfo: Record<string, any>,
  medicalHistory: string,
  createdAt: string
  ```

### 6. Error Handling
1. Define error types
  ```typescript
  interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
  }
  ```
2. Use consistent error responses
3. Include error conversion utilities
4. Add type-safe error handlers

## Guidelines for Changes

### 1. Database Changes
- Always use migrations
- Update types immediately
- Test conversions
- Maintain foreign key naming
- Document JSON schemas

### 2. Frontend Changes
- Keep components small
- Use proper type imports
- Validate props
- Use conversion utilities
- Follow naming patterns

### 3. API Integration
- Use type-safe fetching
- Convert data at boundaries
- Validate responses
- Handle errors consistently
- Document API endpoints

### 4. Testing
- Test type conversions
- Validate data flow
- Check error handling
- Verify naming conventions
- Review type safety

## Documentation
1. Add JSDoc comments for complex types
2. Document conversion edge cases
3. Explain validation rules
4. Note type dependencies
5. Keep examples updated
