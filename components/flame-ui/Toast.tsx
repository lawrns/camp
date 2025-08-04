import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Toast hook for managing toast state
const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement<ToastActionProps>;
  duration?: number;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId: string | undefined;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId: string | undefined;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t: unknown) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        if (toastTimeouts.has(toastId)) {
          clearTimeout(toastTimeouts.get(toastId));
          toastTimeouts.delete(toastId);
        }
      } else {
        for (const [id, timeout] of toastTimeouts.entries()) {
          clearTimeout(timeout);
          toastTimeouts.delete(id);
        }
      }

      return {
        ...state,
        toasts: state.toasts.map((t: unknown) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t: unknown) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

const listeners: ((state: State) => void)[] = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener: unknown) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast(props: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Auto-dismiss after duration
  const duration = props.duration ?? TOAST_REMOVE_DELAY;
  if (duration > 0) {
    const timeout = setTimeout(() => {
      dismiss();
    }, duration);
    toastTimeouts.set(id, timeout);
  }

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

// Toast components
const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[var(--fl-z-toast)] flex max-h-screen w-full flex-col-reverse p-[var(--fl-space-4)] sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  // Base styles
  [
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-[var(--fl-space-4)] overflow-hidden rounded-[var(--fl-rounded-ds-lg)] border p-[var(--fl-space-6)] pr-[var(--fl-space-8)] shadow-[var(--fl-shadow-lg)] transition-all",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out",
    "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
    "data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  ],
  {
    variants: {
      variant: {
        default: ["border-[var(--fl-color-border)]", "bg-[var(--fl-color-background)]", "text-[var(--fl-color-text)]"],
        success: [
          "border-[var(--fl-color-success)]/20",
          "bg-[var(--fl-color-success-subtle)]",
          "text-[var(--fl-color-success-hover)]",
          "[&>svg]:text-[var(--fl-color-success)]",
        ],
        warning: [
          "border-[var(--fl-color-warning)]/20",
          "bg-[var(--fl-color-warning-subtle)]",
          "text-[var(--fl-color-warning-hover)]",
          "[&>svg]:text-[var(--fl-color-warning)]",
        ],
        error: [
          "border-[var(--fl-color-error)]/20",
          "bg-[var(--fl-color-error-subtle)]",
          "text-[var(--fl-color-error-hover)]",
          "[&>svg]:text-[var(--fl-color-error)]",
        ],
        info: [
          "border-[var(--fl-color-info)]/20",
          "bg-[var(--fl-color-info-subtle)]",
          "text-[var(--fl-color-info-hover)]",
          "[&>svg]:text-[var(--fl-color-info)]",
        ],
        brand: [
          "border-[var(--fl-color-brand)]/20",
          "bg-[var(--fl-color-brand-subtle)]",
          "text-[var(--fl-color-brand)]",
          "[&>svg]:text-[var(--fl-color-brand)]",
        ],
        glass: [
          "border-white/20",
          "bg-white/10 backdrop-blur-md",
          "text-[var(--fl-color-text)]",
          "[&>svg]:text-[var(--fl-color-text)]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProps>(
  ({ className, variant, ...props }, ref) => {
    return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
  }
);
Toast.displayName = ToastPrimitives.Root.displayName;

export type ToastActionProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>;

const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Action>, ToastActionProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-[var(--fl-rounded-ds-md)] border border-[var(--fl-color-border)] bg-transparent px-[var(--fl-space-3)] font-[var(--fl-font-weight-medium)] text-[var(--fl-font-size-sm)] ring-offset-background transition-colors",
        "hover:bg-[var(--fl-color-background-subtle)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--fl-color-focus)] focus:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "group-[.error]:border-[var(--fl-color-error)]/30 group-[.error]:hover:border-[var(--fl-color-error)]/50 group-[.error]:hover:bg-[var(--fl-color-error)]/10 group-[.error]:hover:text-[var(--fl-color-error)]",
        "group-[.success]:border-[var(--fl-color-success)]/30 group-[.success]:hover:border-[var(--fl-color-success)]/50 group-[.success]:hover:bg-[var(--fl-color-success)]/10 group-[.success]:hover:text-[var(--fl-color-success)]",
        className
      )}
      {...props}
    />
  )
);
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-[var(--fl-space-2)] top-[var(--fl-space-2)] rounded-[var(--fl-rounded-ds-md)] p-[var(--fl-space-1)] text-[var(--fl-color-text-muted)] opacity-0 transition-opacity",
      "hover:text-[var(--fl-color-text)]",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--fl-color-focus)]",
      "group-hover:opacity-100",
      "group-[.error]:text-[var(--fl-color-error)] group-[.error]:hover:text-[var(--fl-color-error)]",
      "group-[.success]:text-[var(--fl-color-success)] group-[.success]:hover:text-[var(--fl-color-success)]",
      className
    )}
    toast-close=""
    {...props}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[var(--fl-space-4)] w-[var(--fl-space-4)]"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("font-[var(--fl-font-weight-semibold)] text-[var(--fl-font-size-sm)]", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-[var(--fl-font-size-sm)] opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// Toaster component for rendering toasts
function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  Toaster,
  useToast,
  toast,
};
