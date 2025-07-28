/**
 * Unified UI component exports with standardized prop interfaces
 *
 * This file serves as the single source of truth for all UI components
 * ensuring consistent usage across the codebase.
 */

// Flame UI Components (Base)
export * from "./Alert";
export * from "./Avatar";
export * from "./AvatarGroup";
export * from "./Badge";
export * from "./Button";
export * from "./Card";
export * from "./Icon";
export * from "./Progress";
export * from "./ScrollArea";
export * from "./Separator";
export * from "./SlaTimerChip";
export * from "./Skeleton";
export * from "./Tabs";
export * from "./Toast";

// Specialized Components
export * from "./Sidebar";
export * from "./Composer";
export * from "./Realtime";
export * from "./Conversation";

// UI Components
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
export { Calendar } from "./calendar";
export { Checkbox } from "./checkbox";
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

// Command components
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";

// Dialog components
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

// Drawer components
export { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "./drawer";

// Dropdown menu components
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
export { Label } from "./label";

// Navigation menu
export { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "./navigation-menu";

export { Popover, PopoverContent, PopoverTrigger } from "./popover";
export { RadioGroup, RadioGroupItem } from "./radio-group";

// Select components
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

// Sheet components
export { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";

export { Slider } from "./slider";
export { Switch } from "./switch";

// Table components
export { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./table";

export { Textarea } from "./textarea";

// Tooltip components
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

// Phoenix UI Components (prefixed to avoid conflicts)
export * from "./PhoenixFileUpload";
export * from "./PhoenixImagePreview";
export * from "./PhoenixUploadProgress";
export * from "./PhoenixMessageComposer";

export * from "./PhoenixMessageList";
export * from "./PhoenixCannedResponses";
export * from "./PhoenixSearchInput";
export * from "./PhoenixSpinner";
export * from "./PhoenixErrorBoundary";

// Additional components
export * from "./TypingDots";
export * from "./empty-state";
export * from "./BrandLogo";
export * from "./ListItem";
export * from "./flame-gradient";
export * from "./date-picker";
export * from "./glass-morphism";
export * from "./hover-card";
export * from "./improved-input";
export * from "./input";
export * from "./form";

// Type exports
export type * from "./types";
