/**
 * Shared Hooks
 *
 * Reusable React hooks used across all Campfire V2 projects
 */
import { useState, useEffect, useCallback, useRef } from 'react';
// ============================================================================
// LOCAL STORAGE HOOK
// ============================================================================
export function useLocalStorage(key, initialValue) {
    // Get from local storage then parse stored json or return initialValue
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });
    // Return a wrapped version of useState's setter function that persists the new value to localStorage
    const setValue = useCallback((value) => {
        try {
            // Allow value to be a function so we have the same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        }
        catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);
    return [storedValue, setValue];
}
// ============================================================================
// DEBOUNCE HOOK
// ============================================================================
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}
// ============================================================================
// PREVIOUS VALUE HOOK
// ============================================================================
export function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}
// ============================================================================
// TOGGLE HOOK
// ============================================================================
export function useToggle(initialValue = false) {
    const [value, setValue] = useState(initialValue);
    const toggle = useCallback(() => setValue(v => !v), []);
    const setToggle = useCallback((newValue) => setValue(newValue), []);
    return [value, toggle, setToggle];
}
// ============================================================================
// COPY TO CLIPBOARD HOOK
// ============================================================================
export function useCopyToClipboard() {
    const [isCopied, setIsCopied] = useState(false);
    const copyToClipboard = useCallback(async (text) => {
        if (!navigator?.clipboard) {
            console.warn('Clipboard not supported');
            return false;
        }
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
            return true;
        }
        catch (error) {
            console.warn('Copy failed', error);
            setIsCopied(false);
            return false;
        }
    }, []);
    return [isCopied, copyToClipboard];
}
// ============================================================================
// ONLINE STATUS HOOK
// ============================================================================
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    return isOnline;
}
export function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined,
    });
    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return windowSize;
}
// ============================================================================
// MEDIA QUERY HOOK
// ============================================================================
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);
    return matches;
}
// ============================================================================
// INTERSECTION OBSERVER HOOK
// ============================================================================
export function useIntersectionObserver(elementRef, options) {
    const [entry, setEntry] = useState(null);
    useEffect(() => {
        const element = elementRef.current;
        if (!element)
            return;
        const observer = new IntersectionObserver(([entry]) => setEntry(entry), options);
        observer.observe(element);
        return () => observer.disconnect();
    }, [elementRef, options]);
    return entry;
}
// ============================================================================
// CLICK OUTSIDE HOOK
// ============================================================================
export function useClickOutside(ref, handler) {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}
export function useAsync(asyncFunction, dependencies = []) {
    const [state, setState] = useState({
        data: null,
        loading: false,
        error: null,
    });
    const execute = useCallback(async () => {
        setState({ data: null, loading: true, error: null });
        try {
            const data = await asyncFunction();
            setState({ data, loading: false, error: null });
        }
        catch (error) {
            setState({ data: null, loading: false, error: error });
        }
    }, dependencies);
    useEffect(() => {
        execute();
    }, [execute]);
    return { ...state, execute };
}
// ============================================================================
// TIMEOUT HOOK
// ============================================================================
export function useTimeout(callback, delay) {
    const savedCallback = useRef(callback);
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    useEffect(() => {
        if (delay === null)
            return;
        const id = setTimeout(() => savedCallback.current(), delay);
        return () => clearTimeout(id);
    }, [delay]);
}
// ============================================================================
// INTERVAL HOOK
// ============================================================================
export function useInterval(callback, delay) {
    const savedCallback = useRef(callback);
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    useEffect(() => {
        if (delay === null)
            return;
        const id = setInterval(() => savedCallback.current(), delay);
        return () => clearInterval(id);
    }, [delay]);
}
// ============================================================================
// KEYBOARD SHORTCUT HOOK
// ============================================================================
export function useKeyboardShortcut(keys, callback, options = {}) {
    const { preventDefault = true, stopPropagation = true } = options;
    useEffect(() => {
        const handleKeyDown = (event) => {
            const pressedKeys = [];
            if (event.ctrlKey)
                pressedKeys.push('ctrl');
            if (event.metaKey)
                pressedKeys.push('meta');
            if (event.shiftKey)
                pressedKeys.push('shift');
            if (event.altKey)
                pressedKeys.push('alt');
            pressedKeys.push(event.key.toLowerCase());
            const isMatch = keys.every(key => pressedKeys.includes(key.toLowerCase()));
            if (isMatch) {
                if (preventDefault)
                    event.preventDefault();
                if (stopPropagation)
                    event.stopPropagation();
                callback(event);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [keys, callback, preventDefault, stopPropagation]);
}
// ============================================================================
// IDLE HOOK
// ============================================================================
export function useIdle(timeout = 60000) {
    const [isIdle, setIsIdle] = useState(false);
    useEffect(() => {
        let timeoutId;
        const handleActivity = () => {
            setIsIdle(false);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setIsIdle(true), timeout);
        };
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });
        // Set initial timeout
        timeoutId = setTimeout(() => setIsIdle(true), timeout);
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
            clearTimeout(timeoutId);
        };
    }, [timeout]);
    return isIdle;
}
//# sourceMappingURL=index.js.map