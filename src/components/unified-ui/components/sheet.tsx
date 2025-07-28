import * as React from "react";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange?.(false)} />
      {children}
    </>
  );
};

const SheetContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`fixed inset-y-0 right-0 z-50 h-full w-3/4 gap-4 border-l bg-background spacing-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out sm:max-w-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`} {...props} />
);

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3 ref={ref} className={`text-lg font-semibold text-foreground ${className}`} {...props} />
  )
);
SheetTitle.displayName = "SheetTitle";

export { Sheet, SheetContent, SheetHeader, SheetTitle };
