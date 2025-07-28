/**
 * ULTIMATE MESSAGE COMPOSER SPECIFICATION
 *
 * Comprehensive specification for the consolidated inbox message composer
 * that preserves ALL existing functionality while establishing world-class UX
 *
 * Priority: P0 - IMMEDIATE ACTION REQUIRED
 * Target: Exceed Intercom's quality standards
 */

import { ReactNode } from "react";

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface UltimateMessageComposerProps {
  conversationId: string;
  organizationId?: string;
  customerId?: string;
  onMessageSent?: (message: Message) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  features?: ComposerFeatureConfig;
  theme?: ComposerTheme;
  className?: string;
  "data-testid"?: string;
}

export interface ComposerFeatureConfig {
  ai: AIFeatureConfig;
  mentions: MentionsFeatureConfig;
  tagging: TaggingFeatureConfig;
  attachments: AttachmentsFeatureConfig;
  voice: VoiceFeatureConfig;
  emoji: EmojiFeatureConfig;
  templates: TemplatesFeatureConfig;
  realtime: RealtimeFeatureConfig;
  keyboard: KeyboardFeatureConfig;
  accessibility: AccessibilityFeatureConfig;
}

// ============================================================================
// AI FEATURES - WORLD-CLASS IMPLEMENTATION
// ============================================================================

export interface AIFeatureConfig {
  enabled: boolean;
  suggestions: {
    enabled: boolean;
    confidenceThreshold: number; // 0.0 - 1.0
    loadingStates: AILoadingState;
    categories: AISuggestionCategory[];
    showReasoning: boolean;
    analytics: boolean;
    maxSuggestions: number;
    debounceMs: number;
  };
  handover: {
    enabled: boolean;
    showTerminal: boolean;
    confidence: number;
    personas: string[];
    escalationRules: EscalationRule[];
  };
  contextAnalysis: {
    enabled: boolean;
    includeHistory: boolean;
    customerSentiment: boolean;
    urgencyDetection: boolean;
    topicClassification: boolean;
  };
}

export type AILoadingState = "idle" | "loading" | "error" | "ready" | "streaming";

export type AISuggestionCategory = "response" | "action" | "escalation" | "information" | "closing" | "followup";

export interface EscalationRule {
  trigger: "sentiment" | "keywords" | "complexity" | "time";
  threshold: number;
  action: "suggest" | "auto" | "notify";
  targetPersona?: string;
}

export interface AISuggestion {
  id: string;
  category: AISuggestionCategory;
  content: string;
  confidence: number;
  reasoning?: string;
  metadata?: Record<string, any>;
  analytics?: {
    impressions: number;
    acceptances: number;
    rejections: number;
  };
}

// ============================================================================
// MENTIONS SYSTEM - SOPHISTICATED IMPLEMENTATION
// ============================================================================

export interface MentionsFeatureConfig {
  enabled: boolean;
  showPresence: boolean;
  showAvailability: boolean;
  showRole: boolean;
  allowGroups: boolean;
  searchDebounce: number;
  maxResults: number;
  priorityRoles: string[];
  customFilters: MentionFilter[];
}

export interface MentionFilter {
  name: string;
  predicate: (user: User) => boolean;
  icon?: ReactNode;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  presence: "online" | "away" | "busy" | "offline";
  availability: "available" | "in_meeting" | "do_not_disturb" | "away";
  skills: string[];
  timezone: string;
  lastSeen?: Date;
}

// ============================================================================
// TAGGING SYSTEM - ADVANCED IMPLEMENTATION
// ============================================================================

export interface TaggingFeatureConfig {
  enabled: boolean;
  autocomplete: boolean;
  createNew: boolean;
  analytics: boolean;
  maxTags: number;
  validation: RegExp;
  colorCoding: boolean;
  categories: TagCategory[];
  permissions: TagPermissions;
}

export interface TagCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  restricted?: boolean;
}

export interface TagPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canModify: boolean;
  restrictedCategories: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  category?: string;
  description?: string;
  usage_count: number;
  created_by: string;
  created_at: Date;
}

// ============================================================================
// ATTACHMENTS - PREMIUM FILE HANDLING
// ============================================================================

export interface AttachmentsFeatureConfig {
  enabled: boolean;
  dragDrop: boolean;
  progressTracking: boolean;
  preview: boolean;
  cloudStorage: boolean;
  maxSize: number; // bytes
  maxFiles: number;
  allowedTypes: string[];
  thumbnails: boolean;
  compression: CompressionConfig;
  security: SecurityConfig;
}

export interface CompressionConfig {
  enabled: boolean;
  quality: number; // 0.0 - 1.0
  maxDimensions: { width: number; height: number };
  formats: string[];
}

export interface SecurityConfig {
  virusScanning: boolean;
  contentTypeValidation: boolean;
  fileNameSanitization: boolean;
  encryptionInTransit: boolean;
}

export interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error" | "cancelled";
  preview?: string;
  thumbnail?: string;
  error?: string;
  uploadedUrl?: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  size: number;
  type: string;
  lastModified: Date;
  dimensions?: { width: number; height: number };
  duration?: number; // for audio/video
}

// ============================================================================
// VOICE RECORDING - SOPHISTICATED IMPLEMENTATION
// ============================================================================

export interface VoiceFeatureConfig {
  enabled: boolean;
  transcription: boolean;
  waveformVisualization: boolean;
  maxDuration: number; // seconds
  quality: "low" | "medium" | "high";
  formats: string[];
  noiseReduction: boolean;
  autoStop: boolean;
  permissions: VoicePermissions;
}

export interface VoicePermissions {
  requiresPermission: boolean;
  fallbackMessage: string;
  permissionDeniedAction: "hide" | "disable" | "show_message";
}

export interface VoiceRecording {
  id: string;
  duration: number;
  waveform?: number[];
  transcription?: string;
  confidence?: number;
  status: "recording" | "processing" | "completed" | "error";
  blob?: Blob;
  url?: string;
}

// ============================================================================
// EMOJI SYSTEM - DELIGHTFUL IMPLEMENTATION
// ============================================================================

export interface EmojiFeatureConfig {
  enabled: boolean;
  search: boolean;
  categories: EmojiCategory[];
  recentEmojis: boolean;
  skinToneSelection: boolean;
  customEmojis: boolean;
  shortcuts: boolean;
  analytics: boolean;
}

export type EmojiCategory =
  | "recent"
  | "people"
  | "nature"
  | "food"
  | "activity"
  | "travel"
  | "objects"
  | "symbols"
  | "flags"
  | "custom";

export interface Emoji {
  id: string;
  native: string;
  name: string;
  category: EmojiCategory;
  keywords: string[];
  skinTones?: string[];
  custom?: boolean;
  url?: string; // for custom emojis
}

// ============================================================================
// TEMPLATES - SMART QUICK REPLIES
// ============================================================================

export interface TemplatesFeatureConfig {
  enabled: boolean;
  quickReplies: boolean;
  dynamicVariables: boolean;
  templateManagement: boolean;
  analytics: boolean;
  categories: TemplateCategory[];
  permissions: TemplatePermissions;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: ReactNode;
  restricted?: boolean;
}

export interface TemplatePermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  variables: TemplateVariable[];
  usage_count: number;
  created_by: string;
  shared: boolean;
  tags: string[];
}

export interface TemplateVariable {
  name: string;
  type: "text" | "number" | "date" | "select" | "customer_data";
  required: boolean;
  default?: any;
  options?: string[]; // for select type
  customerDataField?: string; // for customer_data type
}

// ============================================================================
// REAL-TIME FEATURES - LIVE COLLABORATION
// ============================================================================

export interface RealtimeFeatureConfig {
  enabled: boolean;
  typingIndicators: boolean;
  presenceAwareness: boolean;
  readReceipts: boolean;
  collaborativeEditing: boolean;
  connectionStatus: boolean;
  reconnection: ReconnectionConfig;
}

export interface ReconnectionConfig {
  autoReconnect: boolean;
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

export interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
  lastTyping: Date;
}

// ============================================================================
// KEYBOARD SHORTCUTS - POWER USER FEATURES
// ============================================================================

export interface KeyboardFeatureConfig {
  enabled: boolean;
  customizable: boolean;
  showHelp: boolean;
  shortcuts: KeyboardShortcut[];
  commandPalette: boolean;
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  action: string;
  context?: "global" | "composer" | "message_list";
  customizable: boolean;
}

// ============================================================================
// ACCESSIBILITY - INCLUSIVE DESIGN
// ============================================================================

export interface AccessibilityFeatureConfig {
  enabled: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  focusManagement: boolean;
  ariaLabels: boolean;
  liveRegions: boolean;
  colorBlindSupport: boolean;
}

// ============================================================================
// THEMING - VISUAL CUSTOMIZATION
// ============================================================================

export interface ComposerTheme {
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  animations: ThemeAnimations;
  shadows: ThemeShadows;
  borders: ThemeBorders;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  borderHover: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeAnimations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    easeInOut: string;
    easeOut: string;
    easeIn: string;
    spring: string;
  };
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  glow: string;
}

export interface ThemeBorders {
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  width: {
    thin: string;
    normal: string;
    thick: string;
  };
}

// ============================================================================
// CORE DATA TYPES
// ============================================================================

export interface Message {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  senderType: "customer" | "agent" | "system";
  timestamp: Date;
  attachments?: FileUpload[];
  mentions?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}

// ============================================================================
// PERFORMANCE REQUIREMENTS
// ============================================================================

export interface PerformanceTargets {
  bundleSize: number; // <50kb gzipped
  renderTime: number; // <100ms initial render
  interactionLatency: number; // <50ms for most actions
  memoryUsage: number; // <10MB peak
  firstContentfulPaint: number; // <1.2s
  timeToInteractive: number; // <2.5s
  cumulativeLayoutShift: number; // <0.1
}

// ============================================================================
// ANALYTICS & MONITORING
// ============================================================================

export interface AnalyticsConfig {
  enabled: boolean;
  events: AnalyticsEvent[];
  performance: boolean;
  errors: boolean;
  userInteractions: boolean;
  featureUsage: boolean;
}

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// ============================================================================
// ERROR HANDLING & RECOVERY
// ============================================================================

export interface ErrorHandlingConfig {
  gracefulDegradation: boolean;
  retryMechanisms: boolean;
  fallbackComponents: boolean;
  errorBoundaries: boolean;
  userNotification: boolean;
  automaticRecovery: boolean;
}

// ============================================================================
// TESTING REQUIREMENTS
// ============================================================================

export interface TestingConfig {
  unitTests: boolean;
  integrationTests: boolean;
  e2eTests: boolean;
  visualRegressionTests: boolean;
  accessibilityTests: boolean;
  performanceTests: boolean;
  loadTests: boolean;
}

// ============================================================================
// DEPLOYMENT & FEATURE FLAGS
// ============================================================================

export interface DeploymentConfig {
  featureFlags: FeatureFlag[];
  rolloutStrategy: RolloutStrategy;
  monitoring: MonitoringConfig;
  rollback: RollbackConfig;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  percentage: number;
  userSegments: string[];
  conditions: Record<string, any>;
}

export interface RolloutStrategy {
  type: "immediate" | "gradual" | "canary" | "blue_green";
  percentage: number;
  duration: number;
  criteria: string[];
}

export interface MonitoringConfig {
  metrics: string[];
  alerts: AlertConfig[];
  dashboards: string[];
}

export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  channels: string[];
}

export interface RollbackConfig {
  automatic: boolean;
  triggers: string[];
  timeout: number;
  strategy: "immediate" | "gradual";
}

// ============================================================================
// COMPONENT STATE MANAGEMENT
// ============================================================================

export interface ComposerState {
  content: string;
  isTyping: boolean;
  isSending: boolean;
  isRecording: boolean;
  attachments: FileUpload[];
  mentions: User[];
  tags: Tag[];
  selectedTemplate?: Template;
  aiSuggestions: AISuggestion[];
  errors: ComposerError[];
  focus: boolean;
  dirty: boolean;
}

export interface ComposerError {
  id: string;
  type: "validation" | "network" | "permission" | "quota" | "system";
  message: string;
  field?: string;
  recoverable: boolean;
  timestamp: Date;
}

// ============================================================================
// HOOKS & UTILITIES
// ============================================================================

export interface ComposerHooks {
  useComposerState: () => [ComposerState, ComposerActions];
  useAISuggestions: (content: string) => AISuggestion[];
  useMentions: (query: string) => User[];
  useTags: (query: string) => Tag[];
  useFileUpload: () => FileUploadHooks;
  useVoiceRecording: () => VoiceRecordingHooks;
  useTemplates: () => Template[];
  useKeyboardShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  useAccessibility: (config: AccessibilityFeatureConfig) => void;
}

export interface ComposerActions {
  setContent: (content: string) => void;
  insertText: (text: string, position?: number) => void;
  addAttachment: (file: File) => void;
  removeAttachment: (id: string) => void;
  addMention: (user: User) => void;
  removeMention: (userId: string) => void;
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  applyTemplate: (template: Template, variables?: Record<string, any>) => void;
  applySuggestion: (suggestion: AISuggestion) => void;
  send: () => Promise<void>;
  clear: () => void;
  focus: () => void;
  blur: () => void;
}

export interface FileUploadHooks {
  upload: (file: File) => Promise<FileUpload>;
  cancel: (id: string) => void;
  retry: (id: string) => void;
  getProgress: (id: string) => number;
}

export interface VoiceRecordingHooks {
  start: () => Promise<void>;
  stop: () => Promise<VoiceRecording>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  getWaveform: () => number[];
  getTranscription: () => Promise<string>;
}

// ============================================================================
// EXPORT DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_COMPOSER_CONFIG: ComposerFeatureConfig = {
  ai: {
    enabled: true,
    suggestions: {
      enabled: true,
      confidenceThreshold: 0.7,
      loadingStates: "idle",
      categories: ["response", "action", "escalation"],
      showReasoning: true,
      analytics: true,
      maxSuggestions: 3,
      debounceMs: 300,
    },
    handover: {
      enabled: true,
      showTerminal: true,
      confidence: 0.8,
      personas: ["support", "technical", "sales"],
      escalationRules: [],
    },
    contextAnalysis: {
      enabled: true,
      includeHistory: true,
      customerSentiment: true,
      urgencyDetection: true,
      topicClassification: true,
    },
  },
  mentions: {
    enabled: true,
    showPresence: true,
    showAvailability: true,
    showRole: true,
    allowGroups: true,
    searchDebounce: 150,
    maxResults: 10,
    priorityRoles: ["admin", "supervisor"],
    customFilters: [],
  },
  tagging: {
    enabled: true,
    autocomplete: true,
    createNew: true,
    analytics: true,
    maxTags: 5,
    validation: /^[a-zA-Z0-9_-]+$/,
    colorCoding: true,
    categories: [],
    permissions: {
      canCreate: true,
      canDelete: true,
      canModify: true,
      restrictedCategories: [],
    },
  },
  attachments: {
    enabled: true,
    dragDrop: true,
    progressTracking: true,
    preview: true,
    cloudStorage: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    allowedTypes: ["image/*", "application/pdf", ".doc", ".docx", ".txt"],
    thumbnails: true,
    compression: {
      enabled: true,
      quality: 0.8,
      maxDimensions: { width: 1920, height: 1080 },
      formats: ["image/jpeg", "image/webp"],
    },
    security: {
      virusScanning: true,
      contentTypeValidation: true,
      fileNameSanitization: true,
      encryptionInTransit: true,
    },
  },
  voice: {
    enabled: true,
    transcription: true,
    waveformVisualization: true,
    maxDuration: 300, // 5 minutes
    quality: "medium",
    formats: ["audio/webm", "audio/mp4"],
    noiseReduction: true,
    autoStop: true,
    permissions: {
      requiresPermission: true,
      fallbackMessage: "Microphone access required for voice messages",
      permissionDeniedAction: "show_message",
    },
  },
  emoji: {
    enabled: true,
    search: true,
    categories: ["recent", "people", "nature", "food", "activity", "travel", "objects", "symbols"],
    recentEmojis: true,
    skinToneSelection: true,
    customEmojis: true,
    shortcuts: true,
    analytics: true,
  },
  templates: {
    enabled: true,
    quickReplies: true,
    dynamicVariables: true,
    templateManagement: true,
    analytics: true,
    categories: [],
    permissions: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
    },
  },
  realtime: {
    enabled: true,
    typingIndicators: true,
    presenceAwareness: true,
    readReceipts: true,
    collaborativeEditing: false,
    connectionStatus: true,
    reconnection: {
      autoReconnect: true,
      maxRetries: 5,
      retryDelay: 1000,
      exponentialBackoff: true,
    },
  },
  keyboard: {
    enabled: true,
    customizable: true,
    showHelp: true,
    shortcuts: [
      {
        id: "send",
        name: "Send Message",
        description: "Send the current message",
        keys: ["Enter"],
        action: "send",
        context: "composer",
        customizable: false,
      },
      {
        id: "newline",
        name: "New Line",
        description: "Insert a new line",
        keys: ["Shift", "Enter"],
        action: "newline",
        context: "composer",
        customizable: false,
      },
    ],
    commandPalette: true,
  },
  accessibility: {
    enabled: true,
    screenReader: true,
    keyboardNavigation: true,
    highContrast: true,
    reducedMotion: true,
    focusManagement: true,
    ariaLabels: true,
    liveRegions: true,
    colorBlindSupport: true,
  },
};

export const PERFORMANCE_TARGETS: PerformanceTargets = {
  bundleSize: 50 * 1024, // 50kb gzipped
  renderTime: 100, // 100ms
  interactionLatency: 50, // 50ms
  memoryUsage: 10 * 1024 * 1024, // 10MB
  firstContentfulPaint: 1200, // 1.2s
  timeToInteractive: 2500, // 2.5s
  cumulativeLayoutShift: 0.1,
};
