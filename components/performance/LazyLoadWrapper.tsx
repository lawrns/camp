"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  className?: string;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number | number[];
  onVisible?: () => void;
  once?: boolean;
}

/**
 * Lazy loading wrapper using Intersection Observer
 * Optimizes initial render by deferring heavy components
 */
export function LazyLoadWrapper({
  children,
  className,
  placeholder = <div className="bg-background h-20 animate-pulse rounded" />,
  rootMargin = "50px",
  threshold = 0.1,
  onVisible,
  once = true,
}: LazyLoadWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    if (once && hasBeenVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry: unknown) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
            onVisible?.();

            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, onVisible, once, hasBeenVisible]);

  return (
    <div ref={elementRef} className={className}>
      {isVisible || (once && hasBeenVisible) ? children : placeholder}
    </div>
  );
}

/**
 * Hook for lazy loading components
 */
export function useLazyLoad(options?: { rootMargin?: string; threshold?: number | number[]; once?: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const { rootMargin = "50px", threshold = 0.1, once = true } = options || {};

  useEffect(() => {
    if (!elementRef.current) return;
    if (once && hasBeenVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry: unknown) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);

            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, once, hasBeenVisible]);

  const shouldRender = once ? hasBeenVisible : isVisible;

  return { ref: elementRef, isVisible, shouldRender };
}
