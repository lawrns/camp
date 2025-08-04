"use client";

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  memo,
  lazy,
  Suspense
} from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { debounce, throttle } from 'lodash-es';

// Memoized message component to prevent unnecessary re-renders
export const MemoizedMessage = memo(function MemoizedMessage({
  message,
  isOwn,
  onAction
}: {
  message: unknown;
  isOwn: boolean;
  onAction: (action: string, messageId: string) => void;
}) {
  // Only re-render if message content, status, or reactions change
  return (
    <div className="message-wrapper">
      {/* Message content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.reactions?.length === nextProps.message.reactions?.length &&
    prevProps.isOwn === nextProps.isOwn
  );
});

// Virtualized message list for large datasets
export function VirtualizedMessageList({
  messages,
  height = 400,
  itemHeight = 80,
  overscan = 5,
  onLoadMore,
  hasMore = false,
  className
}: {
  messages: unknown[];
  height?: number;
  itemHeight?: number | ((index: number) => number);
  overscan?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}) {
  const listRef = useRef<List>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Throttled scroll handler for load more
  const handleScroll = useCallback(
    throttle(({ scrollOffset, scrollUpdateWasRequested }: unknown) => {
      if (!scrollUpdateWasRequested && hasMore && !isLoadingMore && scrollOffset < 100) {
        setIsLoadingMore(true);
        onLoadMore?.();
        setTimeout(() => setIsLoadingMore(false), 1000);
      }
    }, 100),
    [hasMore, isLoadingMore, onLoadMore]
  );

  // Row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    if (!message) return null;

    return (
      <div style={style}>
        <MemoizedMessage
          message={message}
          isOwn={message.senderType === 'user'}
          onAction={(action, messageId) => {
            console.log('Message action:', action, messageId);
          }}
        />
      </div>
    );
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  if (typeof itemHeight === 'function') {
    return (
      <VariableSizeList
        ref={listRef as unknown}
        height={height}
        itemCount={messages.length}
        itemSize={itemHeight}
        overscanCount={overscan}
        onScroll={handleScroll}
        className={className}
      >
        {Row}
      </VariableSizeList>
    );
  }

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={messages.length}
      itemSize={itemHeight}
      overscanCount={overscan}
      onScroll={handleScroll}
      className={className}
    >
      {Row}
    </List>
  );
}

// Debounced search hook
export function useDebouncedSearch(
  searchFunction: (query: string) => void,
  delay = 300
) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      setIsSearching(true);
      searchFunction(searchQuery);
      setIsSearching(false);
    }, delay),
    [searchFunction, delay]
  );

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      debouncedSearch.cancel();
      setIsSearching(false);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    isSearching,
  };
}

// Throttled typing indicator
export function useThrottledTyping(
  onStartTyping: () => void,
  onStopTyping: () => void,
  throttleDelay = 1000,
  stopDelay = 3000
) {
  const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const throttledStartTyping = useMemo(
    () => throttle(() => {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onStartTyping();
      }

      // Clear existing stop timeout
      if (stopTypingTimeoutRef.current) {
        clearTimeout(stopTypingTimeoutRef.current);
      }

      // Set new stop timeout
      stopTypingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onStopTyping();
      }, stopDelay);
    }, throttleDelay),
    [onStartTyping, onStopTyping, throttleDelay, stopDelay]
  );

  const stopTyping = useCallback(() => {
    throttledStartTyping.cancel();
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onStopTyping();
    }
  }, [throttledStartTyping, onStopTyping]);

  useEffect(() => {
    return () => {
      throttledStartTyping.cancel();
      if (stopTypingTimeoutRef.current) {
        clearTimeout(stopTypingTimeoutRef.current);
      }
    };
  }, [throttledStartTyping]);

  return {
    startTyping: throttledStartTyping,
    stopTyping,
  };
}

// Intersection observer hook for read receipts
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const [elements, setElements] = useState<Element[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (elements.length === 0) return;

    observer.current = new IntersectionObserver(callback, {
      threshold: 0.5,
      ...options,
    });

    elements.forEach(element => {
      if (observer.current) {
        observer.current.observe(element);
      }
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [elements, callback, options]);

  const observe = useCallback((element: Element) => {
    setElements(prev => [...prev, element]);
  }, []);

  const unobserve = useCallback((element: Element) => {
    setElements(prev => prev.filter(el => el !== element));
    if (observer.current) {
      observer.current.unobserve(element);
    }
  }, []);

  return { observe, unobserve };
}

// Lazy loaded emoji picker
const LazyEmojiPicker = lazy(() => 
  import('./EnhancedEmojiPicker').then(module => ({ 
    default: module.EnhancedEmojiPicker 
  }))
);

export function LazyEmojiPickerWrapper(props: unknown) {
  return (
    <Suspense fallback={<div className="h-96 w-80 bg-gray-100 animate-pulse rounded-lg" />}>
      <LazyEmojiPicker {...props} />
    </Suspense>
  );
}

// Image lazy loading with placeholder
export function LazyImage({
  src,
  alt,
  placeholder,
  className,
  onLoad,
  onError
}: {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const image = new Image();
          image.onload = () => {
            setIsLoaded(true);
            onLoad?.();
          };
          image.onerror = () => {
            setHasError(true);
            onError?.();
          };
          image.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [src, onLoad, onError]);

  return (
    <div ref={imgRef} className={className}>
      {!isLoaded && !hasError && (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder || <span className="text-gray-400">Loading...</span>}
        </div>
      )}
      
      {isLoaded && !hasError && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
      
      {hasError && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">Failed to load</span>
        </div>
      )}
    </div>
  );
}

// Memory-efficient message cache
export function useMessageCache(maxSize = 1000) {
  const cache = useRef(new Map<string, any>());
  const accessOrder = useRef<string[]>([]);

  const get = useCallback((key: string) => {
    const value = cache.current.get(key);
    if (value) {
      // Move to end (most recently used)
      const index = accessOrder.current.indexOf(key);
      if (index > -1) {
        accessOrder.current.splice(index, 1);
      }
      accessOrder.current.push(key);
    }
    return value;
  }, []);

  const set = useCallback((key: string, value: unknown) => {
    // Remove if already exists
    if (cache.current.has(key)) {
      const index = accessOrder.current.indexOf(key);
      if (index > -1) {
        accessOrder.current.splice(index, 1);
      }
    }

    // Add to cache
    cache.current.set(key, value);
    accessOrder.current.push(key);

    // Evict oldest if over limit
    while (cache.current.size > maxSize) {
      const oldest = accessOrder.current.shift();
      if (oldest) {
        cache.current.delete(oldest);
      }
    }
  }, [maxSize]);

  const clear = useCallback(() => {
    cache.current.clear();
    accessOrder.current = [];
  }, []);

  return { get, set, clear };
}

// Optimized re-render hook
export function useOptimizedRerender<T>(
  value: T,
  compareFn?: (prev: T, next: T) => boolean
) {
  const ref = useRef<T>(value);
  const [, forceUpdate] = useState({});

  const shouldUpdate = compareFn 
    ? !compareFn(ref.current, value)
    : ref.current !== value;

  if (shouldUpdate) {
    ref.current = value;
    forceUpdate({});
  }

  return ref.current;
}

// Batch state updates
export function useBatchedUpdates() {
  const [updates, setUpdates] = useState<Array<() => void>>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchUpdate = useCallback((updateFn: () => void) => {
    setUpdates(prev => [...prev, updateFn]);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setUpdates(currentUpdates => {
        currentUpdates.forEach(fn => fn());
        return [];
      });
    }, 16); // Next frame
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return batchUpdate;
}
