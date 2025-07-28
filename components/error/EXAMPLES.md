# Unified Error Boundary Examples

## Basic Usage

### 1. Simple Error Boundary

```tsx
import { UnifiedErrorBoundary } from "@/components/error";

function MyComponent() {
  return (
    <UnifiedErrorBoundary>
      <YourComponent />
    </UnifiedErrorBoundary>
  );
}
```

### 2. Domain-Specific Error Boundaries

```tsx
import {
  AIErrorBoundary,
  SupabaseErrorBoundary,
  DashboardErrorBoundary
} from '@/components/error';

// AI Components
<AIErrorBoundary maxRetries={5}>
  <AIAssistant />
</AIErrorBoundary>

// Database Components
<SupabaseErrorBoundary retryDelay={2000}>
  <DatabaseQueryComponent />
</SupabaseErrorBoundary>

// Dashboard Components
<DashboardErrorBoundary>
  <DashboardMetrics />
</DashboardErrorBoundary>
```

## Advanced Usage

### 1. Custom Error Handlers

```tsx
import { ErrorHandler, UnifiedErrorBoundary } from "@/components/error";

const customErrorHandler: ErrorHandler = async (error, errorInfo, context) => {
  // Log to custom analytics
  analytics.track("error_occurred", {
    domain: context.domain,
    severity: context.severity,
    errorMessage: error.message,
    errorId: context.errorId,
  });

  // Send notification for critical errors
  if (context.severity === "critical") {
    await notifyOpsTeam({
      error: error.message,
      stack: error.stack,
      context,
    });
  }

  // Custom recovery logic
  if (error.message.includes("network")) {
    await retryWithBackoff();
  }
};

<UnifiedErrorBoundary
  domain="ai"
  onError={customErrorHandler}
  customErrorHandlers={{
    ai: async (error, errorInfo, context) => {
      // AI-specific error handling
      if (error.message.includes("rate limit")) {
        await scheduleRetryAfterRateLimit(context);
      }
    },
  }}
>
  <YourComponent />
</UnifiedErrorBoundary>;
```

### 2. Custom Fallback UI

```tsx
import { UnifiedErrorBoundary } from "@/components/error";

// Function-based fallback
<UnifiedErrorBoundary
  fallback={(error, retry, context) => (
    <div className="error-container">
      <h2>Oops! Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={retry}>
        Try Again ({context.retryCount}/{3})
      </button>
      <details>
        <summary>Error Details</summary>
        <pre>{error.stack}</pre>
      </details>
    </div>
  )}
>
  <YourComponent />
</UnifiedErrorBoundary>;

// Component-based fallback
const CustomErrorFallback = ({ error, onRetry }) => (
  <div className="custom-error">
    <Icon name="error" />
    <p>{error.message}</p>
    <Button onClick={onRetry}>Retry</Button>
  </div>
);

<UnifiedErrorBoundary fallback={<CustomErrorFallback />}>
  <YourComponent />
</UnifiedErrorBoundary>;
```

### 3. With Error Provider

```tsx
import { ErrorBoundaryProvider, useErrorBoundaryContext } from "@/components/error";

// In your root layout/app
function App() {
  return (
    <ErrorBoundaryProvider
      defaultDomain="default"
      defaultSeverity="medium"
      globalErrorHandler={(error, errorInfo, context) => {
        console.error("Global error:", error);
        logToService(error, context);
      }}
      errorBoundaryProps={{
        showErrorDetails: process.env.NODE_ENV === "development",
      }}
    >
      <YourApp />
    </ErrorBoundaryProvider>
  );
}

// In a component
function MyComponent() {
  const { registerErrorHandler, triggerError } = useErrorBoundaryContext();

  useEffect(() => {
    // Register a domain-specific handler
    const unregister = registerErrorHandler("ai", (error, errorInfo, context) => {
      if (error.message.includes("OpenAI")) {
        showToast("AI service temporarily unavailable");
      }
    });

    return unregister;
  }, [registerErrorHandler]);

  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      // Trigger error with specific domain and severity
      triggerError(error as Error, "ai", "high");
    }
  };

  return <button onClick={handleAction}>Perform Action</button>;
}
```

### 4. Reset Strategies

```tsx
// Reset on prop change
<UnifiedErrorBoundary
  resetKeys={[userId, dataVersion]}
  resetOnPropsChange={true}
>
  <UserDashboard userId={userId} version={dataVersion} />
</UnifiedErrorBoundary>

// Manual reset with ref
const errorBoundaryRef = useRef<UnifiedErrorBoundary>(null);

<UnifiedErrorBoundary ref={errorBoundaryRef}>
  <YourComponent />
</UnifiedErrorBoundary>

<button onClick={() => errorBoundaryRef.current?.resetErrorBoundary()}>
  Reset Errors
</button>
```

### 5. Nested Error Boundaries

```tsx
import { AIErrorBoundary, CriticalErrorBoundary, DashboardErrorBoundary } from "@/components/error";

function App() {
  return (
    // Catch critical app-wide errors
    <CriticalErrorBoundary fallback={<CriticalErrorPage />} maxRetries={1}>
      <AppShell>
        // Catch dashboard-specific errors
        <DashboardErrorBoundary fallback={<PartialDashboard />} maxRetries={2}>
          <Dashboard>
            // Catch AI-specific errors
            <AIErrorBoundary maxRetries={5} retryDelay={1500}>
              <AIAssistant />
            </AIErrorBoundary>
          </Dashboard>
        </DashboardErrorBoundary>
      </AppShell>
    </CriticalErrorBoundary>
  );
}
```

### 6. Error Recovery Patterns

```tsx
// Graceful degradation
<UnifiedErrorBoundary
  domain="knowledge"
  fallback={(error, retry) => (
    <div>
      <p>Unable to load latest data. Showing cached version.</p>
      <CachedKnowledgeBase />
      <button onClick={retry}>Try loading latest</button>
    </div>
  )}
>
  <LiveKnowledgeBase />
</UnifiedErrorBoundary>

// Progressive retry with backoff
<UnifiedErrorBoundary
  domain="ai"
  maxRetries={5}
  retryDelay={1000}
  onError={(error, errorInfo, context) => {
    // Exponential backoff
    const delay = Math.pow(2, context.retryCount) * 1000;
    setTimeout(() => {
      // Custom retry logic
    }, delay);
  }}
>
  <AIComponent />
</UnifiedErrorBoundary>
```

### 7. Development vs Production

```tsx
<UnifiedErrorBoundary
  showErrorDetails={process.env.NODE_ENV === "development"}
  enableLogging={true}
  enableReporting={process.env.NODE_ENV === "production"}
  fallback={process.env.NODE_ENV === "development" ? <DevelopmentErrorUI /> : <ProductionErrorUI />}
>
  <YourComponent />
</UnifiedErrorBoundary>
```

### 8. With React Query

```tsx
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { UnifiedErrorBoundary } from "@/components/error";

function MyComponent() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <UnifiedErrorBoundary
          onError={(error, errorInfo, context) => {
            // Reset React Query error state
            reset();
          }}
          fallback={(error, retry) => (
            <div>
              <p>Query failed: {error.message}</p>
              <button
                onClick={() => {
                  reset();
                  retry();
                }}
              >
                Retry Query
              </button>
            </div>
          )}
        >
          <YourQueryComponent />
        </UnifiedErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

### 9. Testing Error Boundaries

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnifiedErrorBoundary } from "@/components/error";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("UnifiedErrorBoundary", () => {
  it("catches and displays errors", () => {
    const onError = jest.fn();

    render(
      <UnifiedErrorBoundary onError={onError} domain="test">
        <ThrowError shouldThrow={true} />
      </UnifiedErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object),
      expect.objectContaining({
        domain: "test",
      })
    );
  });

  it("retries on button click", async () => {
    const { rerender } = render(
      <UnifiedErrorBoundary>
        <ThrowError shouldThrow={true} />
      </UnifiedErrorBoundary>
    );

    const retryButton = screen.getByRole("button", { name: /retry/i });
    await userEvent.click(retryButton);

    rerender(
      <UnifiedErrorBoundary>
        <ThrowError shouldThrow={false} />
      </UnifiedErrorBoundary>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });
});
```

### 10. Performance Monitoring

```tsx
<UnifiedErrorBoundary
  domain="dashboard"
  onError={(error, errorInfo, context) => {
    // Track error metrics
    performance.mark(`error-${context.errorId}`);

    // Log render performance impact
    const measure = performance.measure("error-recovery-time", `error-${context.errorId}`);

    analytics.track("error_performance", {
      recoveryTime: measure.duration,
      domain: context.domain,
      retryCount: context.retryCount,
    });
  }}
>
  <PerformanceCriticalComponent />
</UnifiedErrorBoundary>
```
