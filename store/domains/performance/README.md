# Performance Store

The performance store provides centralized tracking of application performance metrics.

## Usage Examples

### Basic Usage

```typescript
import { usePerformanceStore } from '@/store/domains/performance';

// Track renders
function MyComponent() {
  const { incrementRenderCount } = usePerformanceStore();

  useEffect(() => {
    incrementRenderCount();
  }, []);

  return <div>...</div>;
}

// Track API calls
async function fetchData() {
  const startTime = Date.now();

  try {
    const response = await fetch('/api/data');
    const responseTime = Date.now() - startTime;
    usePerformanceStore.getState().addApiResponseTime(responseTime);
    return response.json();
  } catch (error) {
    usePerformanceStore.getState().incrementErrorCount();
    throw error;
  }
}
```

### Using Hooks

```typescript
import {
  useRenderCount,
  useErrorCount,
  useAverageApiResponseTime,
  usePerformanceSummary
} from '@/store/domains/performance';

function PerformanceMonitor() {
  const renderCount = useRenderCount();
  const errorCount = useErrorCount();
  const avgResponseTime = useAverageApiResponseTime();
  const summary = usePerformanceSummary();

  return (
    <div>
      <p>Renders: {renderCount}</p>
      <p>Errors: {errorCount}</p>
      <p>Avg Response Time: {avgResponseTime}ms</p>
      <p>P95 Response Time: {summary.p95ResponseTime}ms</p>
    </div>
  );
}
```

### Using Utilities

```typescript
import {
  measureApiCall,
  useTrackRender,
  startMemoryMonitoring
} from '@/store/domains/performance';

// Automatic API measurement
const users = await measureApiCall(() => fetch('/api/users').then(r => r.json()));

// Track component renders
function TrackedComponent() {
  useTrackRender();
  return <div>This component's renders are tracked</div>;
}

// Monitor memory usage
useEffect(() => {
  const stopMonitoring = startMemoryMonitoring(30000); // Check every 30s
  return stopMonitoring;
}, []);
```

## Available Metrics

- **Render Count**: Number of component renders
- **API Response Times**: Rolling window of last 100 API calls
- **Error Count**: Total errors encountered
- **Memory Usage**: JavaScript heap size (Chrome only)

## Performance Summary

```typescript
const summary = usePerformanceStore.getState().getPerformanceSummary();
// Returns:
// {
//   renderCount: number;
//   errorCount: number;
//   avgResponseTime: number;
//   p95ResponseTime: number;
//   memoryUsageMB: number | null;
// }
```
