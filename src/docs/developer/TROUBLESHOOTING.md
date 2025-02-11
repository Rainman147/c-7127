
# Troubleshooting Guide

## Common Issues and Solutions

### 1. Vite Build Issues

#### HMR Not Working
- Check if the `@vitejs/plugin-react` is properly configured
- Verify the port is not in use
- Clear browser cache and node_modules

#### TypeScript Errors
```bash
# Regenerate TypeScript definitions
pnpm type-check
```

### 2. Supabase Connection Issues

#### Authentication Errors
- Verify environment variables are correct
- Check RLS policies
- Ensure user has proper permissions

#### Real-time Subscription Issues
- Verify table has REPLICA IDENTITY FULL
- Check channel subscription syntax
- Confirm proper event types are specified

### 3. Shadcn/ui Component Customization

#### Style Overrides
```typescript
// Correct way to override styles
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    className={cn(
      "custom-base-styles",
      className
    )}
    ref={ref}
    {...props}
  />
))
```

#### Component Variants
Modify `components.json` for new variants:
```json
{
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate"
  }
}
```

### 4. Tailwind CSS Issues

#### Classes Not Applied
- Check purge configuration
- Verify class names are correct
- Rebuild with `pnpm build`

#### Dark Mode Issues
- Verify dark mode configuration
- Check theme provider setup
- Confirm proper class usage

