'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  memory: {
    used: number;
    total: number;
    limit: number;
  } | null;
  renderTime: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showPanel?: boolean;
}

export function PerformanceMonitor({ onMetricsUpdate, showPanel = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    memory: null,
    renderTime: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Measure render time
  const measureRenderTime = useCallback(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const renderTime = end - start;
      
      setMetrics(prev => ({
        ...prev,
        renderTime
      }));
    };
  }, []);

  // Get memory usage
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as unknown).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  }, []);

  // Monitor Core Web Vitals
  const monitorCoreWebVitals = useCallback(() => {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          setMetrics(prev => ({
            ...prev,
            lcp: lastEntry.startTime
          }));
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          setMetrics(prev => ({
            ...prev,
            fid: entry.processingStart - entry.startTime
          }));
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: unknown) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            setMetrics(prev => ({
              ...prev,
              cls: clsValue
            }));
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];
        if (firstEntry) {
          setMetrics(prev => ({
            ...prev,
            fcp: firstEntry.startTime
          }));
        }
      });
      fcpObserver.observe({ entryTypes: ['first-contentful-paint'] });

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        fcpObserver.disconnect();
      };
    }
  }, []);

  // Monitor Time to First Byte
  const monitorTTFB = useCallback(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      setMetrics(prev => ({
        ...prev,
        ttfb: navigationEntry.responseStart - navigationEntry.requestStart
      }));
    }
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Initial measurements
    monitorTTFB();
    setMetrics(prev => ({
      ...prev,
      memory: getMemoryUsage()
    }));

    // Monitor memory usage periodically
    const memoryInterval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        memory: getMemoryUsage()
      }));
    }, 5000);

    // Monitor Core Web Vitals
    const cleanup = monitorCoreWebVitals();

    return () => {
      clearInterval(memoryInterval);
      cleanup?.();
    };
  }, [monitorTTFB, getMemoryUsage, monitorCoreWebVitals]);

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  // Notify parent component of metrics updates
  useEffect(() => {
    onMetricsUpdate?.(metrics);
  }, [metrics, onMetricsUpdate]);

  // Get performance grade
  const getPerformanceGrade = (metric: keyof PerformanceMetrics) => {
    const value = metrics[metric];
    if (value === null) return 'N/A';

    switch (metric) {
      case 'lcp':
        if (value < 2500) return 'A';
        if (value < 4000) return 'B';
        return 'C';
      case 'fid':
        if (value < 100) return 'A';
        if (value < 300) return 'B';
        return 'C';
      case 'cls':
        if (value < 0.1) return 'A';
        if (value < 0.25) return 'B';
        return 'C';
      case 'fcp':
        if (value < 1800) return 'A';
        if (value < 3000) return 'B';
        return 'C';
      default:
        return 'N/A';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-yellow-600';
      case 'C': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!showPanel) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Performance Monitor</h3>
        <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={getGradeColor(getPerformanceGrade('lcp'))}>
            {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'} ({getPerformanceGrade('lcp')})
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>FID:</span>
          <span className={getGradeColor(getPerformanceGrade('fid'))}>
            {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'} ({getPerformanceGrade('fid')})
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>CLS:</span>
          <span className={getGradeColor(getPerformanceGrade('cls'))}>
            {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'} ({getPerformanceGrade('cls')})
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={getGradeColor(getPerformanceGrade('fcp'))}>
            {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'} ({getPerformanceGrade('fcp')})
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>TTFB:</span>
          <span>
            {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Render Time:</span>
          <span>
            {metrics.renderTime ? `${Math.round(metrics.renderTime)}ms` : 'N/A'}
          </span>
        </div>
        
        {metrics.memory && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span>
              {metrics.memory.used}MB / {metrics.memory.total}MB
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          A: Excellent | B: Good | C: Needs Improvement
        </div>
      </div>
    </div>
  );
} 