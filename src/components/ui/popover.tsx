import * as React from "react";

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Popover = ({ children, open, onOpenChange }: PopoverProps) => {
  return <div className="relative inline-block">{children}</div>;
};

const PopoverTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className = "", ...props }, ref) => <button ref={ref} className={className} {...props} />
);
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`absolute z-50 w-72 rounded-ds-md border bg-popover spacing-4 text-popover-foreground shadow-md outline-none ${className}`}
      {...props}
    />
  )
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverContent, PopoverTrigger };
