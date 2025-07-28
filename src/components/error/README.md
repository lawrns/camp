# Unified Error Boundary System

A comprehensive, domain-aware error boundary system for React applications that consolidates multiple error boundary implementations into a single, flexible solution.

## Features

- **Domain-Specific Handling**: Specialized error handling for different application domains (AI, Supabase, Dashboard, etc.)
- **Customizable Error Handlers**: Register custom error handlers for each domain
- **Retry Mechanisms**: Built-in retry functionality with configurable limits and delays
- **Error Reporting**: Automatic error reporting to Sentry and custom endpoints
- **Global Error Provider**: Centralized error management across the application
- **Flexible Fallback UI**: Support for custom fallback components or render functions
- **Error Context**: Rich error context with domain, severity, and metadata
- **Development Support**: Enhanced error details in development mode
- **TypeScript Support**: Full TypeScript definitions for type safety

## Quick Start

### Basic Usage

```tsx
import { UnifiedErrorBoundary } from "@/components/error";

function App() {
  return (
    <UnifiedErrorBoundary>
      <YourComponent />
    </UnifiedErrorBoundary>
  );
}
```

### With Error Provider

```tsx
import { ErrorBoundaryProvider } from "@/components/error";

function RootLayout({ children }) {
  return <ErrorBoundaryProvider>{children}</ErrorBoundaryProvider>;
}
```

### Domain-Specific Boundaries

```tsx
import { AIErrorBoundary, SupabaseErrorBoundary } from '@/components/error';

// For AI components
<AIErrorBoundary>
  <AIAssistant />
</AIErrorBoundary>

// For database components
<SupabaseErrorBoundary>
  <DatabaseComponent />
</SupabaseErrorBoundary>
```

## Supported Domains

- `default` - General application errors
- `ai` - AI/ML service errors
- `supabase` - Database connection errors
- `knowledge` - Knowledge base errors
- `dashboard` - Dashboard rendering errors
- `critical` - Critical system errors
- `notification` - Notification system errors
- `auth` - Authentication errors

## API Reference

### UnifiedErrorBoundary Props

| Prop                 | Type                      | Default         | Description                           |
| -------------------- | ------------------------- | --------------- | ------------------------------------- |
| `domain`             | `ErrorDomain`             | `'default'`     | Error domain for specialized handling |
| `severity`           | `ErrorSeverity`           | `'medium'`      | Error severity level                  |
| `fallback`           | `ReactNode \| Function`   | Built-in UI     | Custom fallback UI                    |
| `onError`            | `ErrorHandler`            | -               | Error handler callback                |
| `maxRetries`         | `number`                  | Domain-specific | Maximum retry attempts                |
| `retryDelay`         | `number`                  | `1000`          | Delay between retries (ms)            |
| `resetKeys`          | `Array<string \| number>` | -               | Keys that trigger boundary reset      |
| `resetOnPropsChange` | `boolean`                 | `false`         | Reset on children change              |
| `enableLogging`      | `boolean`                 | `true`          | Enable console logging                |
| `enableReporting`    | `boolean`                 | `true`          | Enable error reporting                |
| `showErrorDetails`   | `boolean`                 | `false`         | Show detailed error info              |

### ErrorBoundaryProvider Props

| Prop                        | Type            | Default     | Description            |
| --------------------------- | --------------- | ----------- | ---------------------- |
| `defaultDomain`             | `ErrorDomain`   | `'default'` | Default error domain   |
| `defaultSeverity`           | `ErrorSeverity` | `'medium'`  | Default severity       |
| `globalErrorHandler`        | `ErrorHandler`  | -           | Global error handler   |
| `enableGlobalErrorCatching` | `boolean`       | `true`      | Catch unhandled errors |

## Migration Guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions from individual error boundaries.

## Examples

See [EXAMPLES.md](./EXAMPLES.md) for comprehensive usage examples.

## Testing

```tsx
import { render, screen } from "@testing-library/react";
import { UnifiedErrorBoundary } from "@/components/error";

test("error boundary catches errors", () => {
  const ThrowError = () => {
    throw new Error("Test error");
  };

  render(
    <UnifiedErrorBoundary>
      <ThrowError />
    </UnifiedErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Performance Considerations

- Error boundaries add minimal overhead during normal operation
- Retry delays prevent rapid re-renders
- Error reporting is asynchronous and non-blocking
- Domain-specific handlers allow targeted optimizations

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- React 16.0+ (Error Boundary support)
- TypeScript 4.0+ (for TypeScript users)

## Contributing

When adding new features:

1. Add new error domains to the `ErrorDomain` type
2. Update default messages and retry limits
3. Add domain-specific wrapper components if needed
4. Update documentation and examples
5. Add tests for new functionality

## License

Part of the Campfire project. See project root for license information.
