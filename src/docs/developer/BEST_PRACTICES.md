
# Development Best Practices

## React Component Architecture

### 1. Component Organization
```typescript
src/
├── components/
│   ├── ui/          # Shadcn/ui components
│   ├── common/      # Shared components
│   └── features/    # Feature-specific components
├── hooks/           # Custom hooks
├── services/        # API services
└── utils/          # Utility functions
```

### 2. Component Patterns
```typescript
// Prefer composition over inheritance
const ComposedComponent = () => {
  return (
    <Layout>
      <Header />
      <Sidebar />
      <MainContent />
    </Layout>
  )
}

// Use custom hooks for logic
const useCustomLogic = () => {
  const [state, setState] = useState()
  // ... logic here
  return { state, setState }
}
```

## Supabase Best Practices

### 1. Query Optimization
```typescript
// Use select() to limit returned columns
const { data } = await supabase
  .from('table')
  .select('id, name')
  .eq('status', 'active')
  .limit(10)

// Use single query for related data
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    comments (
      id,
      content
    )
  `)
```

### 2. RLS Policies
```sql
-- Example RLS policy
CREATE POLICY "Users can only access their own data"
ON public.table_name
FOR SELECT
USING (auth.uid() = user_id);
```

### 3. Edge Functions
```typescript
// Proper error handling
try {
  const response = await supabase.functions.invoke('function-name', {
    body: { data: 'value' }
  })
  
  if (response.error) {
    throw response.error
  }
  
  return response.data
} catch (error) {
  console.error('Edge function error:', error)
  throw error
}
```

## Performance Optimization

### 1. React Query Usage
```typescript
// Proper query configuration
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000 // 30 minutes
})
```

### 2. Component Optimization
```typescript
// Use memo for expensive computations
const memoizedValue = useMemo(() => {
  return expensiveComputation(a, b)
}, [a, b])

// Use callback for function props
const memoizedCallback = useCallback(() => {
  doSomething(a, b)
}, [a, b])
```

### 3. Build Optimization
```typescript
// Code splitting with lazy loading
const LazyComponent = lazy(() => import('./HeavyComponent'))

// Use Suspense for loading states
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

