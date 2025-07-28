import { ComponentType, ElementType } from "react";

// Core Composer Props
export interface ComposerProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (content: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  plugins?: string[];
  [key: string]: any; // For additional props
}

// Plugin System Types
export interface ComposerPlugin {
  id: string;
  name: string;
  icon: ElementType;
  component: ComponentType<ComposerPluginProps>;
  enabled: boolean;
  position: "toolbar-left" | "toolbar-right" | "above-input" | "below-input";
  config?: Record<string, any>;
}

export interface ComposerPluginProps {
  pluginId: string;
  content: string;
  onContentChange: (content: string) => void;
  onAction: (pluginId: string, action: string, data?: any) => void;
  disabled?: boolean;
  config?: Record<string, any>;
}

// Plugin Hook Types
export interface UseComposerPluginsReturn {
  enabledPlugins: ComposerPlugin[];
  registerPlugin: (plugin: ComposerPlugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  executePlugin: (pluginId: string, action: string, data?: any) => void;
  getPlugin: (pluginId: string) => ComposerPlugin | undefined;
}

// Attachment Plugin Types
export interface AttachmentFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  url?: string;
  error?: string;
}

// Template Plugin Types
export interface Template {
  id: string;
  title: string;
  content: string;
  category?: string;
  variables?: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: "text" | "number" | "select";
  required: boolean;
  default?: any;
  options?: string[];
}

// AI Plugin Types
export interface AISuggestion {
  id: string;
  content: string;
  confidence: number;
  category: "response" | "action" | "escalation";
  reasoning?: string;
}

// Voice Plugin Types
export interface VoiceRecording {
  id: string;
  duration: number;
  status: "recording" | "processing" | "completed" | "error";
  blob?: Blob;
  url?: string;
  transcription?: string;
}

// Emoji Plugin Types
export interface Emoji {
  id: string;
  native: string;
  name: string;
  category: string;
  keywords: string[];
}
