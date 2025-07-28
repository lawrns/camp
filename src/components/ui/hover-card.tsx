import * as React from "react";

const HoverCard = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-block">{children}</div>;
};

const HoverCardTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => <div ref={ref} className={className} {...props} />
);
HoverCardTrigger.displayName = "HoverCardTrigger";

const HoverCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`absolute z-50 w-64 rounded-ds-md border bg-popover spacing-4 text-popover-foreground shadow-md outline-none ${className}`}
      {...props}
    />
  )
);
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardContent, HoverCardTrigger };
