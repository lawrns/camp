import * as React from "react";

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-block">{children}</div>;
};

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className = "", asChild = false, ...props }, ref) => {
  if (asChild) {
    return <span ref={ref as React.Ref<HTMLSpanElement>} className={className} {...props} />;
  }
  return <button ref={ref} className={className} {...props} />;
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
  }
>(({ className = "", side = "top", align = "center", ...props }, ref) => (
  <div
    ref={ref}
    className={`absolute z-50 overflow-hidden rounded-ds-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md ${className}`}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
