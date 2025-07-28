import * as React from "react";

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Drawer = ({ open, onOpenChange, children }: DrawerProps) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange?.(false)} />
      {children}
    </>
  );
};

const DrawerContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`fixed inset-x-0 bottom-0 z-50 flex h-auto max-h-[96%] flex-col rounded-t-[10px] border bg-background ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`grid gap-1.5 spacing-4 text-center sm:text-left ${className}`} {...props} />
);

const DrawerTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
  )
);
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", ...props }, ref) => (
    <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props} />
  )
);
DrawerDescription.displayName = "DrawerDescription";

export { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle };
