# Authentication Architecture Guide

## Overview

This document outlines the authentication architecture for Campfire v2 and provides guidelines to prevent common authentication issues.

## Architecture Components

### 1. AuthProvider (`/src/lib/core/auth-provider.tsx`)

The core authentication provider that manages user state, session handling, and authentication flows.

**Key Features:**
- Supabase integration for authentication
- Widget authentication support
- JWT enrichment with organization claims
- Automatic session restoration
- Development-time validation

### 2. AuthProviders (`/src/app/app/client-providers.tsx`)

A wrapper component that combines AuthProvider with error boundaries and other providers.

### 3. AuthGuard (`/lib/auth/auth-guard.tsx`)

A protective component that ensures proper authentication state before rendering protected content.

### 4. Auth Validation (`/lib/auth/auth-validation.ts`)

Development-time validation system that catches authentication setup issues early.

## Setup Requirements

### Root Layout Configuration

The AuthProvider **MUST** be configured at the root level to ensure all components have access to authentication context:

```tsx
// app/layout.tsx
import { AuthProviders } from '@/src/app/app/client-providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProviders>
            <ConditionalNavigation />
            {children}
          </AuthProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Component Usage

Components that need authentication should use the `useAuth` hook:

```tsx
import { useAuth } from '@/lib/core/auth-provider';

function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

## Common Issues and Solutions

### Issue: "useAuth must be used within a AuthProvider"

**Cause:** Component using `useAuth` is not wrapped by AuthProvider.

**Solutions:**
1. Ensure AuthProvider is in the root layout
2. Check component tree hierarchy
3. Verify imports are correct
4. Use AuthGuard for protected routes

**Prevention:**
- Always wrap the entire app with AuthProvider at the root level
- Use the provided AuthGuard component for protected routes
- Run development validation to catch issues early

### Issue: Multiple AuthProviders

**Cause:** AuthProvider is wrapped multiple times in the component tree.

**Solutions:**
1. Remove duplicate AuthProvider wrappers
2. Ensure only one AuthProvider exists at the root level

**Prevention:**
- Follow the single AuthProvider pattern
- Use AuthGuard instead of additional AuthProviders

### Issue: Authentication State Loss

**Cause:** Session not properly restored or JWT not enriched.

**Solutions:**
1. Check session restoration logic
2. Verify JWT enrichment is working
3. Ensure proper error handling

**Prevention:**
- Use the built-in session restoration
- Monitor authentication logs
- Implement proper error boundaries

## Best Practices

### 1. Use AuthGuard for Protected Routes

```tsx
import { AuthGuard } from '@/lib/auth/auth-guard';

function ProtectedPage() {
  return (
    <AuthGuard requireAuth={true} requireOrganization={true}>
      <DashboardContent />
    </AuthGuard>
  );
}
```

### 2. Handle Loading States

```tsx
function MyComponent() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Rest of component
}
```

### 3. Use Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <AuthProviders>
        <YourApp />
      </AuthProviders>
    </ErrorBoundary>
  );
}
```

### 4. Implement Proper Error Handling

```tsx
function LoginForm() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (email: string, password: string) => {
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };
  
  // Rest of component
}
```

## Development Tools

### Auth Validation

The system includes development-time validation that automatically checks for common issues:

- Missing AuthProvider
- Multiple AuthProviders
- Missing error boundaries
- Context availability

### Debug Logging

In development mode, detailed authentication logs are available:

```javascript
// Access debug logs in browser console
console.log(window.authDebug);
```

### React DevTools

Use React DevTools to inspect the component tree and verify AuthProvider presence.

## Widget Authentication

For widget contexts, the system automatically handles anonymous authentication:

```tsx
// Widget authentication is automatic when:
// 1. URL contains organizationId parameter
// 2. CampfireWidgetConfig is present
// 3. Path includes '/widget'
```

## Security Considerations

1. **JWT Enrichment**: Tokens are automatically enriched with organization claims
2. **Session Security**: HTTP-only cookies for session storage
3. **Error Handling**: Sensitive information is not exposed in error messages
4. **Validation**: Input validation on all authentication endpoints

## Troubleshooting

### Check Authentication State

```tsx
function DebugAuth() {
  const auth = useAuth();
  
  return (
    <pre>{JSON.stringify(auth, null, 2)}</pre>
  );
}
```

### Verify Provider Hierarchy

1. Open React DevTools
2. Search for "AuthProvider"
3. Verify it wraps your component
4. Check for multiple instances

### Monitor Network Requests

1. Open browser DevTools
2. Go to Network tab
3. Look for auth-related requests
4. Check for proper session cookies

## Migration Guide

If you're experiencing authentication issues:

1. **Update Root Layout**: Ensure AuthProvider is at the root level
2. **Remove Duplicate Providers**: Remove any additional AuthProvider wrappers
3. **Use AuthGuard**: Replace manual auth checks with AuthGuard
4. **Update Imports**: Use the correct import paths
5. **Test Thoroughly**: Verify all authentication flows work

## Support

For authentication-related issues:

1. Check this documentation
2. Review console logs and debug output
3. Use React DevTools to inspect component tree
4. Run development validation
5. Check network requests in browser DevTools

Remember: Authentication issues are often related to component tree structure and provider hierarchy. Always ensure AuthProvider is properly configured at the root level.