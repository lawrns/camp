import { toast } from "@/hooks/use-enhanced-toast";

// API Response Handler
export async function handleApiResponse<T>(
  promise: Promise<Response>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    loadingMessage?: string;
  }
): Promise<T | null> {
  const loadingToast = toast.loading(options?.loadingMessage || "Processing request...");

  try {
    const response = await promise;

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `Request failed with status ${response.status}`,
      }));

      toast.update({
        id: loadingToast.id,
        variant: "error",
        title: "Error",
        description: options?.errorMessage || error.message || "Request failed",
        persist: false,
        duration: 5000,
      });

      return null;
    }

    const data = await response.json();

    toast.update({
      id: loadingToast.id,
      variant: "success",
      title: "Success",
      description: options?.successMessage || "Request completed successfully",
      persist: false,
      duration: 3000,
    });

    return data as T;
  } catch (error) {
    toast.update({
      id: loadingToast.id,
      variant: "error",
      title: "Error",
      description: options?.errorMessage || (error instanceof Error ? error.message : "An unexpected error occurred"),
      persist: false,
      duration: 5000,
    });

    return null;
  }
}

// Form Submission Handler
export async function handleFormSubmission<T>(
  submitFn: () => Promise<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    loadingMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
): Promise<{ success: boolean; data?: T; error?: Error }> {
  const loadingToast = toast.loading(options?.loadingMessage || "Submitting form...");

  try {
    const data = await submitFn();

    toast.update({
      id: loadingToast.id,
      variant: "success",
      title: "Success",
      description: options?.successMessage || "Form submitted successfully",
      persist: false,
      duration: 3000,
    });

    options?.onSuccess?.(data);

    return { success: true, data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Form submission failed");

    toast.update({
      id: loadingToast.id,
      variant: "error",
      title: "Error",
      description: options?.errorMessage || err.message,
      persist: false,
      duration: 5000,
    });

    options?.onError?.(err);

    return { success: false, error: err };
  }
}

// Real-time Event Notifications
export function notifyRealtimeEvent(
  event: string,
  data?: unknown,
  options?: {
    variant?: "info" | "success" | "warning";
    duration?: number;
    sound?: boolean;
  }
) {
  const messages: Record<string, string> = {
    "user.joined": "A new user joined the conversation",
    "user.left": "A user left the conversation",
    "message.new": "New message received",
    "agent.assigned": "An agent has been assigned to you",
    "agent.typing": "Agent is typing...",
    "connection.lost": "Connection lost. Trying to reconnect...",
    "connection.restored": "Connection restored",
  };

  const message = messages[event] || `Event: ${event}`;

  toast({
    title: event
      .split(".")
      .map((s: unknown) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" "),
    description: message,
    variant: options?.variant || "info",
    duration: options?.duration || 4000,
    sound: options?.sound,
    ...(data && { action: <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre> }),
  });
}

// Background Task Completion
export function notifyTaskCompletion(taskName: string, success: boolean, details?: string) {
  if (success) {
    toast.success(details || `${taskName} completed successfully`, {
      title: "Task Complete",
      duration: 4000,
    });
  } else {
    toast.error(details || `${taskName} failed`, {
      title: "Task Failed",
      duration: 5000,
    });
  }
}

// Connection Status Handler
let connectionToastId: string | null = null;

export function notifyConnectionStatus(status: "online" | "offline" | "reconnecting") {
  // Dismiss previous connection toast if exists
  if (connectionToastId) {
    toast.dismiss(connectionToastId);
  }

  switch (status) {
    case "offline":
      connectionToastId = toast.error("You are currently offline", {
        title: "Connection Lost",
        persist: true,
        action: (
          <button onClick={() => window.location.reload()} className="text-sm font-medium hover:underline">
            Refresh
          </button>
        ),
      }).id;
      break;

    case "reconnecting":
      connectionToastId = toast.loading("Reconnecting...", {
        title: "Connection",
      }).id;
      break;

    case "online":
      if (connectionToastId) {
        toast.success("Connection restored", {
          title: "Back Online",
          duration: 3000,
        });
        connectionToastId = null;
      }
      break;
  }
}

// Batch Notification Handler
export function notifyBatch(
  notifications: Array<{
    message: string;
    variant?: "success" | "error" | "warning" | "info";
  }>
) {
  notifications.forEach((notification, index) => {
    setTimeout(() => {
      toast({
        description: notification.message,
        variant: notification.variant || "info",
        duration: 3000,
      });
    }, index * 200); // Stagger notifications
  });
}
