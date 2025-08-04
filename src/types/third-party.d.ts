/**
 * Third-party Type Definitions
 * Type definitions for external libraries and modules that don't have proper types
 */

// Module declarations for assets
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

declare module "*.webp" {
  const content: string;
  export default content;
}

declare module "*.ico" {
  const content: string;
  export default content;
}

declare module "*.woff" {
  const content: string;
  export default content;
}

declare module "*.woff2" {
  const content: string;
  export default content;
}

declare module "*.ttf" {
  const content: string;
  export default content;
}

declare module "*.eot" {
  const content: string;
  export default content;
}

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.sass" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.less" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.styl" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.json" {
  const content: unknown;
  export default content;
}

// Missing module declarations that are causing TS2307 errors
declare module "@/lib/supabase/service-role-server" {
  import type { SupabaseClient } from "@supabase/supabase-js";
  import type { Database } from "@/types/supabase";

  export function createServiceRoleClient(): SupabaseClient<Database>;
  export function getServiceClient(): SupabaseClient<Database>;
  export default function createClient(): SupabaseClient<Database>;
}

declare module "@/lib/supabase/server-client" {
  import type { SupabaseClient } from "@supabase/supabase-js";
  import type { Database } from "@/types/supabase";

  export function createServerClient(): SupabaseClient<Database>;
  export function getServerClient(): SupabaseClient<Database>;
  export default function createClient(): SupabaseClient<Database>;
}

declare module "@/lib/auth/service" {
  export interface AuthService {
    validateToken(token: string): Promise<{ valid: boolean; user?: unknown }>;
    getUser(token: string): Promise<any>;
    createSession(user: unknown): Promise<string>;
    destroySession(token: string): Promise<void>;
  }

  export const authService: AuthService;
  export default authService;
}

declare module "@/lib/db" {
  export interface DatabaseConnection {
    query(sql: string, params?: unknown[]): Promise<any>;
    transaction(fn: (trx: unknown) => Promise<any>): Promise<any>;
  }

  export const db: DatabaseConnection;
  export default db;
}

declare module "@/lib/storage" {
  export interface StorageService {
    upload(file: File, path: string): Promise<string>;
    download(path: string): Promise<Blob>;
    delete(path: string): Promise<void>;
    getPublicUrl(path: string): string;
  }

  export const storage: StorageService;
  export default storage;
}

declare module "@/lib/realtime" {
  import type { RealtimeChannel } from "@supabase/supabase-js";

  export interface RealtimeService {
    createChannel(name: string): RealtimeChannel;
    getChannel(name: string): RealtimeChannel | null;
    removeChannel(name: string): void;
    broadcast(channel: string, event: string, payload: unknown): void;
  }

  export const realtime: RealtimeService;
  export default realtime;
}

declare module "@/lib/feature-flags" {
  export function isFeatureEnabled(flag: string): boolean;
  export function getFeatureValue(flag: string): unknown;
  export function getAllFeatures(): Record<string, any>;
}

declare module "@/lib/store" {
  export interface Store<T = any> {
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    delete(key: string): void;
    clear(): void;
  }

  export function useStore<T = any>(): Store<T>;
  export default useStore;
}

declare module "@/lib/utils/client-factory" {
  import type { SupabaseClient } from "@supabase/supabase-js";
  import type { Database } from "@/types/supabase";

  export function createSupabaseClient(): SupabaseClient<Database>;
  export function createBrowserClient(): SupabaseClient<Database>;
  export function createServerClient(): SupabaseClient<Database>;
  export function createServiceClient(): SupabaseClient<Database>;
}

// Global type augmentations for commonly used globals
declare global {
  // Supabase client globals
  const createServiceRoleClient: () => import("@supabase/supabase-js").SupabaseClient<
    import("@/types/supabase").Database
  >;
  const createSupabaseClient: () => import("@supabase/supabase-js").SupabaseClient<import("@/types/supabase").Database>;
  const createBrowserClient: () => import("@supabase/supabase-js").SupabaseClient<import("@/types/supabase").Database>;

  // Auth service globals
  const authService: {
    validateToken(token: string): Promise<{ valid: boolean; user?: unknown }>;
    getUser(token: string): Promise<any>;
    createSession(user: unknown): Promise<string>;
    destroySession(token: string): Promise<void>;
  };

  // Database globals
  const db: {
    query(sql: string, params?: unknown[]): Promise<any>;
    transaction(fn: (trx: unknown) => Promise<any>): Promise<any>;
  };

  // Storage globals
  const storage: {
    upload(file: File, path: string): Promise<string>;
    download(path: string): Promise<Blob>;
    delete(path: string): Promise<void>;
    getPublicUrl(path: string): string;
  };

  // Realtime globals
  const realtime: {
    createChannel(name: string): import("@supabase/supabase-js").RealtimeChannel;
    getChannel(name: string): import("@supabase/supabase-js").RealtimeChannel | null;
    removeChannel(name: string): void;
    broadcast(channel: string, event: string, payload: unknown): void;
  };

  // Feature flags globals
  const isFeatureEnabled: (flag: string) => boolean;
  const getFeatureValue: (flag: string) => any;

  // Store globals
  const useStore: <T = any>() => {
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    delete(key: string): void;
    clear(): void;
  };

  // Realtime channel type
  type RealtimeChannel = import("@supabase/supabase-js").RealtimeChannel;
}

// Missing npm modules that don't have proper types
declare module "react-use-websocket" {
  export interface SendMessage {
    (message: string): void;
  }

  export interface WebSocketHook {
    sendMessage: SendMessage;
    lastMessage: MessageEvent | null;
    readyState: number;
    getWebSocket: () => WebSocket | null;
  }

  export default function useWebSocket(socketUrl: string | null, options?: unknown): WebSocketHook;
}

declare module "react-hotkeys-hook" {
  export function useHotkeys(keys: string, callback: (event: KeyboardEvent) => void, options?: unknown): void;
}

declare module "react-infinite-scroll-component" {
  import { ComponentProps } from "react";
  export default function InfiniteScroll(
    props: ComponentProps<"div"> & {
      dataLength: number;
      next: () => void;
      hasMore: boolean;
      loader: React.ReactNode;
      endMessage?: React.ReactNode;
    }
  ): JSX.Element;
}

declare module "react-virtualized-auto-sizer" {
  export interface AutoSizerProps {
    children: ({ width, height }: { width: number; height: number }) => React.ReactNode;
    className?: string;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    nonce?: string;
    onResize?: (info: { height: number; width: number }) => void;
    style?: React.CSSProperties;
  }

  export default function AutoSizer(props: AutoSizerProps): JSX.Element;
}

declare module "react-intersection-observer" {
  export interface IntersectionOptions {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
    triggerOnce?: boolean;
    skip?: boolean;
    initialInView?: boolean;
    fallbackInView?: boolean;
    trackVisibility?: boolean;
    delay?: number;
  }

  export interface IntersectionObserverEntry {
    boundingClientRect: DOMRectReadOnly;
    intersectionRatio: number;
    intersectionRect: DOMRectReadOnly;
    isIntersecting: boolean;
    rootBounds: DOMRectReadOnly | null;
    target: Element;
    time: number;
  }

  export function useInView(
    options?: IntersectionOptions
  ): [(node?: Element | null) => void, boolean, IntersectionObserverEntry | undefined];
}

declare module "react-use-measure" {
  export interface RectReadOnly {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  }

  export default function useMeasure(): [(element: Element | null) => void, RectReadOnly];
}

declare module "react-spring" {
  export interface SpringConfig {
    mass?: number;
    tension?: number;
    friction?: number;
    clamp?: boolean;
    precision?: number;
    velocity?: number;
    duration?: number;
    easing?: (t: number) => number;
  }

  export interface SpringValue<T = any> {
    get(): T;
    set(value: T): void;
    start(): void;
    stop(): void;
    reset(): void;
  }

  export function useSpring(config: unknown): unknown;
  export function useTransition(data: unknown, config: unknown): unknown;
  export function animated(element: unknown): unknown;
}

// Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}

declare module "react-speech-recognition" {
  export interface SpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
  }

  export interface UseSpeechRecognitionReturn {
    transcript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
  }

  export default function useSpeechRecognition(options?: SpeechRecognitionOptions): UseSpeechRecognitionReturn;

  export const SpeechRecognition: {
    startListening: (options?: SpeechRecognitionOptions) => void;
    stopListening: () => void;
    abortListening: () => void;
  };
}

// Clipboard API
declare module "react-copy-to-clipboard" {
  export interface CopyToClipboardProps {
    text: string;
    onCopy?: (text: string, result: boolean) => void;
    options?: {
      debug?: boolean;
      message?: string;
      format?: string;
    };
    children: React.ReactElement;
  }

  export class CopyToClipboard extends React.Component<CopyToClipboardProps> {}
}

// File handling
declare module "react-dropzone" {
  export interface DropzoneOptions {
    accept?: string | string[] | Record<string, string[]>;
    disabled?: boolean;
    maxFiles?: number;
    maxSize?: number;
    minSize?: number;
    multiple?: boolean;
    onDrop?: (acceptedFiles: File[], rejectedFiles: File[]) => void;
    onDropAccepted?: (files: File[]) => void;
    onDropRejected?: (files: File[]) => void;
    onDragEnter?: () => void;
    onDragLeave?: () => void;
    onDragOver?: () => void;
    onFileDialogCancel?: () => void;
  }

  export interface DropzoneState {
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFocused: boolean;
    acceptedFiles: File[];
    rejectedFiles: File[];
    getRootProps: (props?: unknown) => any;
    getInputProps: (props?: unknown) => any;
    open: () => void;
  }

  export default function useDropzone(options?: DropzoneOptions): DropzoneState;
}

// Time and date utilities
declare module "timeago.js" {
  export function timeAgo(date: Date | string | number, locale?: string): string;
  export function format(date: Date | string | number, locale?: string): string;
  export function register(locale: string, localeFunc: unknown): void;
}

declare module "react-timeago" {
  export interface ReactTimeagoProps {
    date: Date | string | number;
    formatter?: (value: number, unit: string, suffix: string) => string;
    component?: React.ComponentType<any> | string;
    live?: boolean;
    minPeriod?: number;
    maxPeriod?: number;
    title?: string;
    now?: () => number;
    locale?: string;
    [key: string]: unknown;
  }

  export default function ReactTimeago(props: ReactTimeagoProps): JSX.Element;
}

// Utility libraries
declare module "classnames" {
  export type ClassValue = string | number | boolean | undefined | null | { [key: string]: unknown } | ClassValue[];

  export default function classNames(...args: ClassValue[]): string;
}

declare module "clsx" {
  export type ClassValue = string | number | boolean | undefined | null | { [key: string]: unknown } | ClassValue[];

  export default function clsx(...args: ClassValue[]): string;
}

// Additional missing modules from common imports
declare module "react-window" {
  export interface ListProps {
    children: React.ComponentType<any>;
    height: number;
    itemCount: number;
    itemSize: number | ((index: number) => number);
    width?: number;
    overscanCount?: number;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: "forward" | "backward";
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    ref?: React.Ref<any>;
  }

  export const FixedSizeList: React.ComponentType<ListProps>;
  export const VariableSizeList: React.ComponentType<ListProps>;
}

declare module "react-sortablejs" {
  export interface SortableProps {
    list: unknown[];
    setList: (list: unknown[]) => void;
    children: React.ReactNode;
    tag?: string;
    className?: string;
    options?: unknown;
  }

  export const ReactSortable: React.ComponentType<SortableProps>;
}

declare module "canvas-confetti" {
  export interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x: number; y: number };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  export default function confetti(options?: ConfettiOptions): Promise<void>;
}

declare module "unique-names-generator" {
  export interface Config {
    dictionaries: string[][];
    separator?: string;
    length?: number;
    style?: "lowerCase" | "upperCase" | "capital";
  }

  export function uniqueNamesGenerator(config: Config): string;
  export const adjectives: string[];
  export const colors: string[];
  export const animals: string[];
  export const names: string[];
}

declare module "qrcode" {
  export interface QRCodeOptions {
    version?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    type?: "image/png" | "image/jpeg" | "image/webp";
    quality?: number;
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeOptions): Promise<void>;
  export function toSVG(text: string, options?: QRCodeOptions): Promise<string>;
  export function toString(text: string, options?: QRCodeOptions): Promise<string>;
}

declare module "ua-parser-js" {
  export interface UAParserInstance {
    getBrowser(): { name?: string; version?: string };
    getCPU(): { architecture?: string };
    getDevice(): { model?: string; type?: string; vendor?: string };
    getEngine(): { name?: string; version?: string };
    getOS(): { name?: string; version?: string };
    getResult(): {
      ua: string;
      browser: { name?: string; version?: string };
      cpu: { architecture?: string };
      device: { model?: string; type?: string; vendor?: string };
      engine: { name?: string; version?: string };
      os: { name?: string; version?: string };
    };
    setUA(ua: string): UAParserInstance;
  }

  export default class UAParser {
    constructor(ua?: string);
    getBrowser(): { name?: string; version?: string };
    getCPU(): { architecture?: string };
    getDevice(): { model?: string; type?: string; vendor?: string };
    getEngine(): { name?: string; version?: string };
    getOS(): { name?: string; version?: string };
    getResult(): {
      ua: string;
      browser: { name?: string; version?: string };
      cpu: { architecture?: string };
      device: { model?: string; type?: string; vendor?: string };
      engine: { name?: string; version?: string };
      os: { name?: string; version?: string };
    };
    setUA(ua: string): UAParser;
  }
}

// Export type definitions
export {};
