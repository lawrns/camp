/**
 * Shared Hooks
 *
 * Reusable React hooks used across all Campfire V2 projects
 */
export declare function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void];
export declare function useDebounce<T>(value: T, delay: number): T;
export declare function usePrevious<T>(value: T): T | undefined;
export declare function useToggle(initialValue?: boolean): [boolean, () => void, (value: boolean) => void];
export declare function useCopyToClipboard(): [boolean, (text: string) => Promise<boolean>];
export declare function useOnlineStatus(): boolean;
interface WindowSize {
    width: number | undefined;
    height: number | undefined;
}
export declare function useWindowSize(): WindowSize;
export declare function useMediaQuery(query: string): boolean;
export declare function useIntersectionObserver(elementRef: React.RefObject<Element>, options?: IntersectionObserverInit): IntersectionObserverEntry | null;
export declare function useClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void): void;
interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}
export declare function useAsync<T>(asyncFunction: () => Promise<T>, dependencies?: React.DependencyList): AsyncState<T> & {
    execute: () => Promise<void>;
};
export declare function useTimeout(callback: () => void, delay: number | null): void;
export declare function useInterval(callback: () => void, delay: number | null): void;
export declare function useKeyboardShortcut(keys: string[], callback: (event: KeyboardEvent) => void, options?: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
}): void;
export declare function useIdle(timeout?: number): boolean;
export {};
//# sourceMappingURL=index.d.ts.map