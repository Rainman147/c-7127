
# State Management Architecture

## Global State Management

### 1. Core State Architecture
- Leverage React Context for global application state
- Utilize React Query for server state management
- Implement local state with useState/useReducer
- Use Supabase real-time subscriptions for live updates

### 2. State Categories

#### User Context
```typescript
interface UserContext {
  user: User | null;
  doctor: Doctor | null;
  preferences: UserPreferences;
  permissions: UserPermissions;
}
```

#### Patient Context
```typescript
interface PatientContext {
  currentPatient: Patient | null;
  patientHistory: PatientHistory[];
  vitals: VitalSigns[];
  medications: Medication[];
}
```

#### Application State
```typescript
interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeView: string;
  notifications: Notification[];
}
```

### 3. State Update Patterns

#### Optimistic Updates
```typescript
const updatePatientRecord = async (patientId: string, update: PatientUpdate) => {
  // Cache previous state
  const previousData = queryClient.getQueryData(['patient', patientId]);
  
  // Optimistically update UI
  queryClient.setQueryData(['patient', patientId], old => ({
    ...old,
    ...update
  }));
  
  try {
    // Perform actual update
    await supabase
      .from('patients')
      .update(update)
      .eq('id', patientId);
  } catch (error) {
    // Revert on failure
    queryClient.setQueryData(['patient', patientId], previousData);
    throw error;
  }
};
```

### 4. Caching Strategy

#### Query Cache Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});
```

### 5. Real-time Sync Patterns

#### Supabase Real-time Subscriptions
```typescript
const usePatientSync = (patientId: string) => {
  useEffect(() => {
    const channel = supabase
      .channel('patient-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `id=eq.${patientId}`
        },
        payload => {
          queryClient.invalidateQueries(['patient', patientId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);
};
```

### 6. State Persistence

#### Local Storage Strategy
- Persist non-sensitive user preferences
- Cache frequently accessed reference data
- Store session-specific UI state

#### Example Implementation
```typescript
const usePersistentState = <T>(
  key: string,
  initialState: T
): [T, (value: T) => void] => {
  const [state, setState] = useState<T>(() => {
    const persisted = localStorage.getItem(key);
    return persisted ? JSON.parse(persisted) : initialState;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};
```

### 7. Performance Considerations

#### State Splitting
- Split context by domain/feature
- Use selective context subscription
- Implement state selectors for granular updates

#### Memory Management
- Clear unused cache entries
- Implement cache size limits
- Remove listeners on unmount

### 8. Error Handling

#### State Error Boundaries
```typescript
interface StateError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

const handleStateError = (error: StateError) => {
  // Log error
  console.error('State management error:', error);
  
  // Notify user
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  });
  
  // Attempt recovery
  queryClient.clear();
};
```

### 9. Testing Strategy

#### State Testing Patterns
```typescript
describe('Patient State', () => {
  it('should update patient data optimistically', async () => {
    const update = { name: 'John Doe' };
    const { result } = renderHook(() => usePatientUpdate());
    
    // Verify optimistic update
    act(() => {
      result.current.updatePatient('123', update);
    });
    
    expect(result.current.patient.name).toBe('John Doe');
  });
});
```

