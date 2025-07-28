/**
 * Unified UI component exports with standardized prop interfaces
 *
 * This file serves as the single source of truth for all UI components
 * ensuring consistent usage across the codebase.
 */

// Core components
export { Button } from "./button";
export { Input } from "./input";
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

// Form components - conditionally exported
export { Form, FormField, FormSubmit } from "./form";

// Type exports
export type {
  BaseComponentProps,
  ButtonProps,
  ButtonVariants,
  InputProps,
  FormProps,
  FormFieldProps,
  CardProps,
  SelectOption,
  SelectProps,
  ModalProps,
  LayoutProps,
  LoadingState,
  ErrorState,
  EmptyState,
  DataStateProps,
  ListProps,
  PaginationProps,
} from "./types";

// Other UI components
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
export { Alert, AlertDescription, AlertTitle } from "./alert";
export { Avatar, AvatarFallback, AvatarImage } from "./avatar";
export { Badge } from "./badge";
export { Calendar } from "./calendar";
export { Checkbox } from "./checkbox";
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

// Command components - basic exports only
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

// Drawer components - basic exports only
export { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "./drawer";

// Dropdown menu components - basic exports only
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
export { Progress } from "./progress";
export { RadioGroup, RadioGroupItem } from "./radio-group";

// Select components
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export { Separator } from "./separator";

// Sheet components
export { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";

export { Skeleton } from "./skeleton";
export { Slider } from "./slider";
export { Switch } from "./switch";

// Table components
export { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./table";

export { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
export { Textarea } from "./textarea";

// Tooltip components
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

// Utility functions
export { cn } from "@/lib/utils";
