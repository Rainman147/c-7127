
# Development Workflow

## Component Development

### 1. Using Shadcn/ui Components
```typescript
// Import pre-built components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Usage with Tailwind classes
const MyComponent = () => {
  return (
    <div className="space-y-4">
      <Input className="w-full" placeholder="Enter text" />
      <Button variant="default">Submit</Button>
    </div>
  )
}
```

### 2. State Management
- Use React Query for server state
- Local state with useState/useReducer
- Context for global state
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData
})
```

### 3. Supabase Integration

#### Database Operations
```typescript
import { supabase } from "@/integrations/supabase/client"

// Query data
const { data, error } = await supabase
  .from('table_name')
  .select('*')

// Insert data
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: value }])
```

#### Real-time Subscriptions
```typescript
const channel = supabase
  .channel('table_changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'table_name' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### 4. Edge Functions
Located in `supabase/functions/`:
```typescript
// Example edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { name } = await req.json()
  const data = { message: `Hello ${name}!` }
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
})
```

## Styling Guidelines

### 1. Tailwind CSS Organization
```typescript
// Component-specific styles
const Card = () => (
  <div className="
    rounded-lg 
    bg-white 
    shadow-md 
    dark:bg-gray-800
    p-6
    space-y-4
    hover:shadow-lg 
    transition-shadow
  ">
    {/* Content */}
  </div>
)
```

### 2. Theme Customization
Modify `tailwind.config.ts` for theme changes:
```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      }
    }
  }
}
```

