
# UI/UX Technical Guidelines

## 1. Design System

### 1.1 Color Palette
```typescript
interface ColorSystem {
  primary: {
    main: '#212121';     // Main background
    secondary: '#444654'; // Secondary elements
    hover: '#2A2B32';    // Hover states
    border: '#4E4F60';   // Borders
  };
  text: {
    primary: '#FFFFFF';   // Primary text
    secondary: '#D1D5DB'; // Secondary text
    muted: '#9CA3AF';    // Muted text
  };
  accent: {
    blue: '#3B82F6';     // Primary actions
    green: '#10B981';    // Success states
    red: '#EF4444';      // Error states
    yellow: '#F59E0B';   // Warning states
  };
}
```

### 1.2 Typography
```typescript
interface Typography {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'];
    mono: ['JetBrains Mono', 'monospace'];
  };
  fontSize: {
    xs: '0.75rem';    // 12px
    sm: '0.875rem';   // 14px
    base: '1rem';     // 16px
    lg: '1.125rem';   // 18px
    xl: '1.25rem';    // 20px
    '2xl': '1.5rem';  // 24px
  };
  fontWeight: {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
}
```

### 1.3 Spacing
```typescript
interface Spacing {
  layout: {
    page: '2rem';
    section: '1.5rem';
    component: '1rem';
  };
  gap: {
    xs: '0.25rem';  // 4px
    sm: '0.5rem';   // 8px
    md: '1rem';     // 16px
    lg: '1.5rem';   // 24px
    xl: '2rem';     // 32px
  };
}
```

## 2. Component Guidelines

### 2.1 Button Variants
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

// Usage Example
<Button
  variant="primary"
  size="md"
  className="flex items-center gap-2"
>
  <PlusIcon className="h-4 w-4" />
  <span>Create New</span>
</Button>
```

### 2.2 Form Elements
```typescript
interface InputProps {
  variant: 'default' | 'ghost';
  error?: string;
  label?: string;
  helperText?: string;
}

// Usage Example
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
    variant="default"
  />
  <p className="text-sm text-muted">We'll never share your email.</p>
</div>
```

## 3. Layout Patterns

### 3.1 Grid System
```typescript
// Base grid container
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-12 md:col-span-6 lg:col-span-4">
    {/* Content */}
  </div>
</div>

// Responsive grid variations
const gridVariants = {
  default: 'grid-cols-1 gap-4',
  cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  sidebar: 'grid-cols-12 gap-4',
};
```

### 3.2 Container Sizes
```typescript
interface ContainerSizes {
  sm: 'max-w-screen-sm';   // 640px
  md: 'max-w-screen-md';   // 768px
  lg: 'max-w-screen-lg';   // 1024px
  xl: 'max-w-screen-xl';   // 1280px
  '2xl': 'max-w-screen-2xl'; // 1536px
}
```

## 4. Animation Guidelines

### 4.1 Transition Presets
```typescript
interface TransitionPresets {
  default: 'transition-all duration-200 ease-in-out';
  slow: 'transition-all duration-300 ease-in-out';
  fast: 'transition-all duration-150 ease-in-out';
}

// Usage Example
<div className="transition-all duration-200 ease-in-out hover:scale-105">
  {/* Content */}
</div>
```

### 4.2 Animation Patterns
```typescript
const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  scaleIn: 'animate-scale-in',
  spin: 'animate-spin',
};
```

## 5. Responsive Design

### 5.1 Breakpoints
```typescript
interface Breakpoints {
  sm: '640px';   // Small devices
  md: '768px';   // Medium devices
  lg: '1024px';  // Large devices
  xl: '1280px';  // Extra large devices
  '2xl': '1536px'; // 2X Extra large devices
}
```

### 5.2 Mobile-First Approach
```typescript
// Example of mobile-first responsive classes
const responsiveClasses = {
  padding: 'p-4 md:p-6 lg:p-8',
  columns: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  fontSize: 'text-sm md:text-base lg:text-lg',
};
```

## 6. Dark Mode Support

### 6.1 Color Variables
```typescript
interface DarkModeColors {
  background: 'bg-white dark:bg-gray-900';
  text: 'text-gray-900 dark:text-gray-100';
  border: 'border-gray-200 dark:border-gray-700';
  hover: 'hover:bg-gray-100 dark:hover:bg-gray-800';
}
```

### 6.2 Implementation
```typescript
// Component example with dark mode support
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <h1 className="text-2xl font-bold">Dark Mode Ready</h1>
  <p className="text-gray-600 dark:text-gray-400">
    This content adapts to dark mode automatically
  </p>
</div>
```

## 7. Accessibility Guidelines

### 7.1 ARIA Attributes
```typescript
interface AriaAttributes {
  button: {
    role: 'button';
    'aria-pressed'?: boolean;
    'aria-label': string;
  };
  dialog: {
    role: 'dialog';
    'aria-modal': boolean;
    'aria-labelledby': string;
  };
}
```

### 7.2 Focus Management
```typescript
// Focus styles
const focusStyles = {
  default: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
  within: 'focus-within:ring-2 focus-within:ring-primary-500',
  visible: 'focus-visible:ring-2 focus-visible:ring-primary-500',
};
```

## 8. Performance Optimization

### 8.1 Image Loading
```typescript
// Responsive image example
<img
  src={imageSrc}
  alt={imageAlt}
  loading="lazy"
  className="w-full h-auto"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 8.2 Component Lazy Loading
```typescript
// React.lazy example
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

## 9. Best Practices

### 9.1 Component Structure
```typescript
// Component template
interface ComponentProps {
  // Props interface
}

const Component: React.FC<ComponentProps> = ({
  // Destructured props
}) => {
  // Hooks
  
  // Event handlers
  
  // Render
  return (
    // JSX
  );
};
```

### 9.2 Error Boundaries
```typescript
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

// Error boundary implementation
class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  // ... Error boundary implementation
}
```

## 10. Testing Guidelines

### 10.1 Component Testing
```typescript
// Jest + React Testing Library example
describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### 10.2 Visual Regression Testing
```typescript
// Storybook example
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
};

export const Primary = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};
```

