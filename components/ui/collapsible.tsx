import * as React from "react";

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Collapsible = ({ children, open, onOpenChange, className = "", ...props }: CollapsibleProps) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className = "", asChild = false, ...props }, ref) => {
    if (asChild) {
      // Filter out button-specific props when rendering as div
      const {
        form,
        formAction,
        formEncType,
        formMethod,
        formNoValidate,
        formTarget,
        type,
        value,
        disabled,
        name,
        autoFocus,
        ...divProps
      } = props;
      return <div {...(divProps as React.HTMLAttributes<HTMLDivElement>)} />;
    }
    return <button ref={ref} className={className} {...props} />;
  }
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => <div ref={ref} className={className} {...props} />
);
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
