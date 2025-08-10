import * as React from "react";

type CommandProps = React.HTMLAttributes<HTMLDivElement>;

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
}

export const Command = React.forwardRef<HTMLDivElement, CommandProps>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex h-full w-full flex-col overflow-hidden rounded-ds-md bg-popover text-popover-foreground ${className}`}
    {...props}
  />
));
Command.displayName = "Command";

interface CommandDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export const CommandDialog = ({ children, open, onOpenChange, ...props }: CommandDialogProps) => {
  return (
    <div {...props} style={{ display: open ? "block" : "none" }} role="dialog" aria-modal="true">
      {children}
    </div>
  );
};

export const CommandEmpty = React.forwardRef<HTMLDivElement, CommandProps>(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`py-6 text-center text-sm ${className}`} {...props} />
));
CommandEmpty.displayName = "CommandEmpty";

export const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className = "", heading, ...props }, ref) => (
    <div ref={ref} className={`overflow-hidden spacing-1 text-foreground ${className}`} {...props}>
      {heading && <div className="px-2 py-1.5 text-tiny font-medium text-muted-foreground">{heading}</div>}
      {props.children}
    </div>
  )
);
CommandGroup.displayName = "CommandGroup";

export const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`flex h-11 w-full rounded-ds-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
);
CommandInput.displayName = "CommandInput";

export const CommandItem = React.forwardRef<HTMLDivElement, CommandProps>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`relative flex cursor-default select-none items-center rounded-ds-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
    {...props}
  />
));
CommandItem.displayName = "CommandItem";

export const CommandList = React.forwardRef<HTMLDivElement, CommandProps>(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`max-h-[300px] overflow-y-auto overflow-x-hidden ${className}`} {...props} />
));
CommandList.displayName = "CommandList";

export const CommandSeparator = React.forwardRef<HTMLDivElement, CommandProps>(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`-mx-1 h-px bg-border ${className}`} {...props} />
));
CommandSeparator.displayName = "CommandSeparator";
