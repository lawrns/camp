/**
 * Standardized Icon System - Campfire V2
 * 
 * Centralized icon definitions using Lucide React with consistent sizing,
 * semantic naming, and accessibility features.
 */

import React from 'react';
import {
  // Navigation & UI
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Minus,
  Search,
  Filter,
  Settings,
  Home,
  
  // Communication
  MessageCircle,
  MessageSquare,
  Send,
  Reply,
  Forward,
  Phone,
  PhoneCall,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  
  // User & People
  User,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Crown,
  Shield,
  
  // Status & Indicators
  Circle,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Zap,
  Star,
  Heart,
  
  // Actions
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Share,
  Link,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  
  // Files & Media
  File,
  FileText,
  Image,
  Paperclip,
  Camera,
  Folder,
  FolderOpen,
  
  // System
  Refresh,
  Loader2,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Globe,
  
  // Business
  Building,
  Mail,
  Calendar,
  Clock3,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  
  // AI & Automation
  Bot,
  Cpu,
  Brain,
  Sparkles,
  Wand2,
  
  // Emotions & Reactions
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  
  // Layout & Organization
  Layout,
  Grid,
  List,
  Columns,
  Sidebar,
  
  // Development
  Code,
  Terminal,
  Bug,
  GitBranch,
  
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// ICON CONFIGURATION
// ============================================================================

export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  base: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const DEFAULT_ICON_SIZE = ICON_SIZES.base;

// ============================================================================
// ICON COMPONENT WRAPPER
// ============================================================================

interface IconProps {
  size?: keyof typeof ICON_SIZES | number;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

function createIcon(LucideComponent: LucideIcon, defaultLabel?: string) {
  return React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 'base', className, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden, ...props }, ref) => {
      const iconSize = typeof size === 'number' ? size : ICON_SIZES[size];
      
      return (
        <LucideComponent
          ref={ref}
          size={iconSize}
          className={className}
          aria-label={ariaLabel || defaultLabel}
          aria-hidden={ariaHidden}
          {...props}
        />
      );
    }
  );
}

// ============================================================================
// NAVIGATION & UI ICONS
// ============================================================================

export const NavigationIcons = {
  Menu: createIcon(Menu, 'Menu'),
  Close: createIcon(X, 'Close'),
  ChevronDown: createIcon(ChevronDown, 'Expand'),
  ChevronUp: createIcon(ChevronUp, 'Collapse'),
  ChevronLeft: createIcon(ChevronLeft, 'Previous'),
  ChevronRight: createIcon(ChevronRight, 'Next'),
  ArrowLeft: createIcon(ArrowLeft, 'Go back'),
  ArrowRight: createIcon(ArrowRight, 'Go forward'),
  ArrowUp: createIcon(ArrowUp, 'Go up'),
  ArrowDown: createIcon(ArrowDown, 'Go down'),
  MoreHorizontal: createIcon(MoreHorizontal, 'More options'),
  MoreVertical: createIcon(MoreVertical, 'More options'),
  Add: createIcon(Plus, 'Add'),
  Remove: createIcon(Minus, 'Remove'),
  Search: createIcon(Search, 'Search'),
  Filter: createIcon(Filter, 'Filter'),
  Settings: createIcon(Settings, 'Settings'),
  Home: createIcon(Home, 'Home'),
} as const;

// ============================================================================
// COMMUNICATION ICONS
// ============================================================================

export const CommunicationIcons = {
  Chat: createIcon(MessageCircle, 'Chat'),
  Message: createIcon(MessageSquare, 'Message'),
  Send: createIcon(Send, 'Send'),
  Reply: createIcon(Reply, 'Reply'),
  Forward: createIcon(Forward, 'Forward'),
  Phone: createIcon(Phone, 'Phone'),
  Call: createIcon(PhoneCall, 'Call'),
  Video: createIcon(Video, 'Video'),
  Microphone: createIcon(Mic, 'Microphone'),
  MicrophoneOff: createIcon(MicOff, 'Microphone off'),
  VolumeOn: createIcon(Volume2, 'Volume on'),
  VolumeOff: createIcon(VolumeX, 'Volume off'),
} as const;

// ============================================================================
// USER & PEOPLE ICONS
// ============================================================================

export const UserIcons = {
  User: createIcon(User, 'User'),
  Users: createIcon(Users, 'Users'),
  AddUser: createIcon(UserPlus, 'Add user'),
  RemoveUser: createIcon(UserMinus, 'Remove user'),
  VerifiedUser: createIcon(UserCheck, 'Verified user'),
  BlockedUser: createIcon(UserX, 'Blocked user'),
  Admin: createIcon(Crown, 'Admin'),
  Moderator: createIcon(Shield, 'Moderator'),
} as const;

// ============================================================================
// STATUS & INDICATOR ICONS
// ============================================================================

export const StatusIcons = {
  Online: createIcon(Circle, 'Online'),
  Success: createIcon(CheckCircle, 'Success'),
  Error: createIcon(XCircle, 'Error'),
  Warning: createIcon(AlertTriangle, 'Warning'),
  Info: createIcon(Info, 'Information'),
  Alert: createIcon(AlertCircle, 'Alert'),
  Time: createIcon(Clock, 'Time'),
  Priority: createIcon(Zap, 'Priority'),
  Favorite: createIcon(Star, 'Favorite'),
  Like: createIcon(Heart, 'Like'),
} as const;

// ============================================================================
// ACTION ICONS
// ============================================================================

export const ActionIcons = {
  Edit: createIcon(Edit, 'Edit'),
  Delete: createIcon(Trash2, 'Delete'),
  Copy: createIcon(Copy, 'Copy'),
  Download: createIcon(Download, 'Download'),
  Upload: createIcon(Upload, 'Upload'),
  Share: createIcon(Share, 'Share'),
  Link: createIcon(Link, 'Link'),
  ExternalLink: createIcon(ExternalLink, 'Open in new tab'),
  Show: createIcon(Eye, 'Show'),
  Hide: createIcon(EyeOff, 'Hide'),
  Lock: createIcon(Lock, 'Lock'),
  Unlock: createIcon(Unlock, 'Unlock'),
} as const;

// ============================================================================
// FILE & MEDIA ICONS
// ============================================================================

export const FileIcons = {
  File: createIcon(File, 'File'),
  Document: createIcon(FileText, 'Document'),
  Image: createIcon(Image, 'Image'),
  Attachment: createIcon(Paperclip, 'Attachment'),
  Camera: createIcon(Camera, 'Camera'),
  Folder: createIcon(Folder, 'Folder'),
  FolderOpen: createIcon(FolderOpen, 'Open folder'),
} as const;

// ============================================================================
// SYSTEM ICONS
// ============================================================================

export const SystemIcons = {
  Refresh: createIcon(Refresh, 'Refresh'),
  Loading: createIcon(Loader2, 'Loading'),
  Online: createIcon(Wifi, 'Online'),
  Offline: createIcon(WifiOff, 'Offline'),
  Battery: createIcon(Battery, 'Battery'),
  Signal: createIcon(Signal, 'Signal'),
  Globe: createIcon(Globe, 'Globe'),
} as const;

// ============================================================================
// BUSINESS ICONS
// ============================================================================

export const BusinessIcons = {
  Organization: createIcon(Building, 'Organization'),
  Email: createIcon(Mail, 'Email'),
  Calendar: createIcon(Calendar, 'Calendar'),
  Schedule: createIcon(Clock3, 'Schedule'),
  Analytics: createIcon(BarChart3, 'Analytics'),
  TrendUp: createIcon(TrendingUp, 'Trending up'),
  TrendDown: createIcon(TrendingDown, 'Trending down'),
  Revenue: createIcon(DollarSign, 'Revenue'),
} as const;

// ============================================================================
// AI & AUTOMATION ICONS
// ============================================================================

export const AIIcons = {
  Bot: createIcon(Bot, 'AI Bot'),
  AI: createIcon(Cpu, 'AI'),
  Intelligence: createIcon(Brain, 'Intelligence'),
  Magic: createIcon(Sparkles, 'Magic'),
  Automation: createIcon(Wand2, 'Automation'),
} as const;

// ============================================================================
// EMOTION & REACTION ICONS
// ============================================================================

export const EmotionIcons = {
  Happy: createIcon(Smile, 'Happy'),
  Sad: createIcon(Frown, 'Sad'),
  Neutral: createIcon(Meh, 'Neutral'),
  ThumbsUp: createIcon(ThumbsUp, 'Thumbs up'),
  ThumbsDown: createIcon(ThumbsDown, 'Thumbs down'),
} as const;

// ============================================================================
// LAYOUT ICONS
// ============================================================================

export const LayoutIcons = {
  Layout: createIcon(Layout, 'Layout'),
  Grid: createIcon(Grid, 'Grid'),
  List: createIcon(List, 'List'),
  Columns: createIcon(Columns, 'Columns'),
  Sidebar: createIcon(Sidebar, 'Sidebar'),
} as const;

// ============================================================================
// DEVELOPMENT ICONS
// ============================================================================

export const DevelopmentIcons = {
  Code: createIcon(Code, 'Code'),
  Terminal: createIcon(Terminal, 'Terminal'),
  Bug: createIcon(Bug, 'Bug'),
  Branch: createIcon(GitBranch, 'Branch'),
} as const;

// ============================================================================
// CONSOLIDATED ICON EXPORT
// ============================================================================

export const Icons = {
  ...NavigationIcons,
  ...CommunicationIcons,
  ...UserIcons,
  ...StatusIcons,
  ...ActionIcons,
  ...FileIcons,
  ...SystemIcons,
  ...BusinessIcons,
  ...AIIcons,
  ...EmotionIcons,
  ...LayoutIcons,
  ...DevelopmentIcons,
} as const;

// ============================================================================
// ICON UTILITIES
// ============================================================================

export function getIconSize(size: keyof typeof ICON_SIZES | number): number {
  return typeof size === 'number' ? size : ICON_SIZES[size];
}

export function createCustomIcon(
  LucideComponent: LucideIcon,
  defaultProps: Partial<IconProps> = {}
) {
  return React.forwardRef<SVGSVGElement, IconProps>((props, ref) => {
    const mergedProps = { ...defaultProps, ...props };
    const IconComponent = createIcon(LucideComponent);
    return <IconComponent ref={ref} {...mergedProps} />;
  });
}

// ============================================================================
// SEMANTIC ICON GROUPS
// ============================================================================

export const SemanticIcons = {
  // Conversation states
  ConversationOpen: Icons.Chat,
  ConversationClosed: Icons.Success,
  ConversationPending: Icons.Time,
  
  // Message types
  TextMessage: Icons.Message,
  ImageMessage: Icons.Image,
  FileMessage: Icons.File,
  SystemMessage: Icons.Info,
  
  // User roles
  Agent: Icons.User,
  Customer: Icons.Users,
  AI: AIIcons.Bot,
  Admin: UserIcons.Admin,
  
  // Priority levels
  LowPriority: Icons.Priority,
  MediumPriority: Icons.Warning,
  HighPriority: Icons.Error,
  UrgentPriority: Icons.Alert,
  
  // Status indicators
  OnlineStatus: StatusIcons.Online,
  OfflineStatus: SystemIcons.Offline,
  AwayStatus: StatusIcons.Warning,
  BusyStatus: StatusIcons.Error,
  
  // Actions
  SendMessage: CommunicationIcons.Send,
  AttachFile: FileIcons.Attachment,
  TakePhoto: FileIcons.Camera,
  StartCall: CommunicationIcons.Call,
  StartVideo: CommunicationIcons.Video,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type IconSize = keyof typeof ICON_SIZES;
export type IconComponent = ReturnType<typeof createIcon>;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default Icons;
