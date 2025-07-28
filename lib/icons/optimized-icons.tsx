/**
 * Optimized Icons
 * Re-exports commonly used icons with performance optimizations
 */

import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  Bookmark,
  Bot,
  Brain,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  EyeOff,
  Facebook,
  File,
  FileText,
  Filter,
  Flame,
  Folder,
  FolderOpen,
  Github,
  Grid,
  Heart,
  HelpCircle,
  Home,
  Image,
  Info,
  Instagram,
  Key,
  Linkedin,
  List,
  Lock,
  Mail,
  Menu,
  MessageCircle,
  MessageSquare,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Redo,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  Search,
  Settings,
  Share,
  Shield,
  Sparkles,
  Star,
  StickyNote,
  Target,
  Trash,
  Twitter,
  Undo,
  Unlock,
  Upload,
  User,
  Users,
  Video,
  X,
  XCircle,
  Zap,
} from "lucide-react";

// Import lucide icons

export {
  // Navigation icons
  Menu,
  X,
  Home,
  Settings,
  User,
  Users,
  Search,
  Bell,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Video,
  Calendar,
  Clock,

  // Action icons
  Plus,
  Minus,
  Edit,
  Trash,
  Save,
  Copy,
  Share,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  Undo,
  Redo,

  // Status icons
  Check,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  XCircle,

  // Arrow icons
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,

  // File icons
  File,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Paperclip,

  // UI icons
  Eye,
  EyeOff,
  Star,
  Heart,
  Bookmark,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  MoreVertical,

  // Missing icons
  Rocket,
  Sparkles,
  Brain,
  Target,
  StickyNote,

  // Brand icons
  Github,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,

  // Campfire specific icons
  Flame,
  Bot,
  Zap,
  Shield,
  Lock,
  Unlock,
  Key,
};

// Icon aliases for convenience
export const Lightning = Zap;
export const Sparkle = Sparkles;

// Custom icon components for better performance
export const SpinnerIcon = () => (
  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export const LoadingIcon = () => (
  <svg className="h-4 w-4 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-7.364l-2.828 2.828m-8.486 8.486l-2.828 2.828m12.728 0l-2.828-2.828M6.636 6.636L3.808 3.808"
    ></path>
  </svg>
);

export const CampfireIcon = () => (
  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 2c-1.5 4-4 6-4 11a4 4 0 008 0c0-5-2.5-7-4-11z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 9c-.5 2-2 3-2 5.5a2 2 0 004 0c0-2.5-1.5-3.5-2-5.5z"
    />
  </svg>
);

export const AIIcon = () => (
  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 2L2 7v10c0 5.55 3.84 10 9 9 5.16 1 9-3.45 9-9V7l-10-5z"
    />
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8" />
  </svg>
);

// Icon utility functions
export const getIconByName = (name: string) => {
  const iconMap: Record<string, React.ComponentType> = {
    menu: Menu,
    x: X,
    home: Home,
    settings: Settings,
    user: User,
    users: Users,
    search: Search,
    bell: Bell,
    mail: Mail,
    message: MessageCircle,
    phone: Phone,
    video: Video,
    calendar: Calendar,
    clock: Clock,
    plus: Plus,
    minus: Minus,
    edit: Edit,
    trash: Trash,
    save: Save,
    copy: Copy,
    share: Share,
    download: Download,
    upload: Upload,
    refresh: RefreshCw,
    check: Check,
    alert: AlertTriangle,
    info: Info,
    help: HelpCircle,
    error: XCircle,
    "chevron-up": ChevronUp,
    "chevron-down": ChevronDown,
    "chevron-left": ChevronLeft,
    "chevron-right": ChevronRight,
    "arrow-up": ArrowUp,
    "arrow-down": ArrowDown,
    "arrow-left": ArrowLeft,
    "arrow-right": ArrowRight,
    file: File,
    folder: Folder,
    image: Image,
    paperclip: Paperclip,
    eye: Eye,
    "eye-off": EyeOff,
    star: Star,
    heart: Heart,
    bookmark: Bookmark,
    filter: Filter,
    grid: Grid,
    list: List,
    "more-horizontal": MoreHorizontal,
    "more-vertical": MoreVertical,
    github: Github,
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    instagram: Instagram,
    flame: Flame,
    bot: Bot,
    zap: Zap,
    shield: Shield,
    lock: Lock,
    unlock: Unlock,
    key: Key,
    rocket: Rocket,
    sparkle: Sparkles,
    brain: Brain,
    lightning: Zap,
    target: Target,
    note: StickyNote,
    spinner: SpinnerIcon,
    loading: LoadingIcon,
    campfire: CampfireIcon,
    ai: AIIcon,
  };

  return iconMap[name] || null;
};
