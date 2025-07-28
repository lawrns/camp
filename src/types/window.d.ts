// AI API Types
interface AIModelAvailability {
  readily: "no" | "after-download" | "readily";
}

interface AITextSessionOptions {
  temperature?: number;
  topK?: number;
  systemPrompt?: string;
}

interface AITextSession {
  prompt: (text: string) => Promise<string>;
  promptStreaming: (text: string) => ReadableStream<string>;
  destroy: () => void;
}

declare global {
  interface Window {
    ai?: {
      canCreateGenericSession: () => Promise<AIModelAvailability>;
      canCreateTextSession: () => Promise<AIModelAvailability>;
      createTextSession: (options?: AITextSessionOptions) => Promise<AITextSession>;
      defaultTextSessionOptions: () => Promise<AITextSessionOptions>;
    };
  }
}

export {};
