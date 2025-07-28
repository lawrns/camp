/**
 * Improved toast hook with additional features
 */

import { toast, type ExternalToast } from "sonner";

interface ImprovedToastOptions extends ExternalToast {
  type?: "success" | "error" | "warning" | "info" | "loading";
  persistent?: boolean;
  showClose?: boolean;
  autoClose?: boolean;
  closeDelay?: number;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastPromiseOptions {
  loading: string;
  success: string | ((data: any) => string);
  error: string | ((error: any) => string);
}

export function useImprovedToast() {
  const showToast = (message: string, options: ImprovedToastOptions = {}) => {
    const { type = "info", persistent = false, autoClose = true, closeDelay = 5000, action, ...restOptions } = options;

    const toastOptions: ExternalToast = {
      ...restOptions,
      duration: persistent ? Infinity : autoClose ? closeDelay : Infinity,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    };

    switch (type) {
      case "success":
        return toast.success(message, toastOptions);
      case "error":
        return toast.error(message, toastOptions);
      case "warning":
        return toast.warning(message, toastOptions);
      case "loading":
        return toast.loading(message, toastOptions);
      default:
        return toast(message, toastOptions);
    }
  };

  const success = (message: string, options?: Omit<ImprovedToastOptions, "type">) => {
    return showToast(message, { ...options, type: "success" });
  };

  const error = (message: string, options?: Omit<ImprovedToastOptions, "type">) => {
    return showToast(message, { ...options, type: "error" });
  };

  const warning = (message: string, options?: Omit<ImprovedToastOptions, "type">) => {
    return showToast(message, { ...options, type: "warning" });
  };

  const info = (message: string, options?: Omit<ImprovedToastOptions, "type">) => {
    return showToast(message, { ...options, type: "info" });
  };

  const loading = (message: string, options?: Omit<ImprovedToastOptions, "type">) => {
    return showToast(message, { ...options, type: "loading" });
  };

  const promise = <T>(promiseOrFunction: Promise<T> | (() => Promise<T>), options: ToastPromiseOptions) => {
    const promise = typeof promiseOrFunction === "function" ? promiseOrFunction() : promiseOrFunction;

    return toast.promise(promise, {
      loading: options.loading,
      success: (data) => {
        return typeof options.success === "function" ? options.success(data) : options.success;
      },
      error: (error) => {
        return typeof options.error === "function" ? options.error(error) : options.error;
      },
    });
  };

  const dismiss = (id?: string | number) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  };

  const custom = (component: React.ReactNode, options?: ImprovedToastOptions) => {
    return toast.custom(component, options);
  };

  // Utility functions
  const showConfirmation = (message: string, onConfirm: () => void, onCancel?: () => void) => {
    return showToast(message, {
      type: "warning",
      persistent: true,
      action: {
        label: "Confirm",
        onClick: () => {
          onConfirm();
          dismiss();
        },
      },
    });
  };

  const showWithUndo = (message: string, onUndo: () => void, options?: ImprovedToastOptions) => {
    return showToast(message, {
      ...options,
      type: "success",
      action: {
        label: "Undo",
        onClick: onUndo,
      },
    });
  };

  const showProgress = (message: string, progress: number, options?: ImprovedToastOptions) => {
    return showToast(`${message} (${Math.round(progress)}%)`, {
      ...options,
      type: "loading",
      persistent: progress < 100,
    });
  };

  return {
    // Basic methods
    toast: showToast,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    custom,

    // Utility methods
    showConfirmation,
    showWithUndo,
    showProgress,
  };
}

// Default export for convenience
export default useImprovedToast;
