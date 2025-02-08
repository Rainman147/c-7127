
# Type and Naming Conventions

This document outlines the standardized naming and type conventions for our application.

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
```

### Frontend Types (src/types/[entity].ts)
```typescript
// No prefix, focused on UI needs
interface Patient {
  id: string;
  name: string;
  medicalHistory: string;
}
```

### Conversion Layer (src/utils/transforms/[entity].ts)
```typescript
// Database → Frontend
const toFrontendPatient = (dbPatient: DbPatient): Patient => ({
  id: dbPatient.id,
  name: dbPatient.name,
  medicalHistory: dbPatient.medical_history
});

// Frontend → Database
const toDatabasePatient = (patient: Patient): DbPatient => ({
  id: patient.id,
  name: patient.name,
  medical_history: patient.medicalHistory
});
```

## Best Practices

1. **Layer Separation**
   - Never mix snake_case and camelCase within the same layer
   - Always use conversion functions between layers
   - Keep frontend types focused on UI needs
   - Keep database types exact to schema

2. **Type Safety**
   - Use TypeScript strict mode
   - Add explicit type annotations
   - Validate data at layer boundaries
   - Use conversion utilities consistently

3. **Naming Patterns**
   - Database columns: lowercase with underscores
   - React components: PascalCase
   - Functions: camelCase
   - Types/Interfaces: PascalCase
   - Constants: UPPER_SNAKE_CASE

4. **Date/Time Fields**
   - Database: `created_at`, `updated_at`
   - Frontend: `createdAt`, `updatedAt`

5. **JSON/Record Fields**
   - Database keys: snake_case
   - Frontend keys: camelCase

## Example Implementation

### Database Type
```typescript
type DbPatient = {
  id: string;
  user_id: string;
  medical_history: string;
  contact_info: Json;
  created_at: string;
  updated_at: string;
}
```

### Frontend Type
```typescript
interface Patient {
  id: string;
  userId: string;
  medicalHistory: string;
  contactInfo: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### Conversion Function
```typescript
const toFrontendPatient = (dbPatient: DbPatient): Patient => ({
  id: dbPatient.id,
  userId: dbPatient.user_id,
  medicalHistory: dbPatient.medical_history,
  contactInfo: dbPatient.contact_info,
  createdAt: dbPatient.created_at,
  updatedAt: dbPatient.updated_at
});
```

## Edge Functions
1. Accept camelCase parameters (frontend convention)
2. Convert to snake_case for database operations
3. Convert back to camelCase for response
4. Use type-safe conversion utilities

## Additional Guidelines
1. Document complex types with JSDoc comments
2. Use TypeScript utility types when appropriate
3. Keep conversion functions simple and pure
4. Add validation for critical data transformations
5. Maintain consistent error handling patterns
