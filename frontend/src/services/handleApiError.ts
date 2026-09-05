// src/utils/handleApiError.ts
import { toast } from "react-toastify";

export interface ApiErrorOptions {
  onRateLimit?: (seconds: number) => void;
}

export const handleApiError = (error: any, options?: ApiErrorOptions) => {
  // 1. Network / Connection Error (Server Down, No Internet)
  if (!error.response) {
    toast.error("Network error. Please check your internet connection.", {
      toastId: "network-error",
    });
    return;
  }

  const { status, data, headers } = error.response;

  // Extract message from common backend error structures
  const serverMessage =
    data?.message || data?.error || data?.detail || "An unexpected error occurred.";

  switch (status) {
    case 400: // Bad Request / Validation Failure
      toast.error(serverMessage || "Invalid request. Please check your inputs.");
      break;

    case 401: // Unauthorized (Token Expired or Missing)
      toast.error("Session expired. Please log in again.", { toastId: "auth-401" });
      // Optional: Redirect to login or clear auth token
      break;

    case 403: // Forbidden (No Permission)
      toast.error("Access denied. You don't have permission for this action.");
      break;

    case 404: // Resource Not Found
      toast.error(serverMessage || "The requested item was not found.");
      break;

    case 409: // Conflict (e.g., Email already exists)
      toast.error(serverMessage || "A conflict occurred with existing data.");
      break;

    case 422: // Validation Errors (e.g., Laravel / Express field validations)
      if (data?.errors && typeof data.errors === "object") {
        // If the backend returns field-level error messages
        const firstError = Object.values(data.errors).flat()[0] as string;
        toast.error(firstError || serverMessage);
      } else {
        toast.error(serverMessage);
      }
      break;

    case 429: { // Rate Limit Exceeded
      const retryAfter = headers?.["retry-after"];
      const seconds = retryAfter ? parseInt(retryAfter, 10) : 10;

      toast.error(`${serverMessage} Please wait ${seconds}s before trying again.`, {
        toastId: "rate-limit-toast", // Prevent duplicate toasts
        autoClose: seconds * 1000,
      });

      // Execute callback to trigger local cooldown timers on buttons
      if (options?.onRateLimit) {
        options.onRateLimit(seconds);
      }
      break;
    }

    case 500: // Internal Server Error
    case 502: // Bad Gateway
    case 503: // Service Unavailable
    case 504: // Gateway Timeout
      toast.error("Server error. Please try again later.", { toastId: "server-500" });
      break;

    default:
      toast.error(serverMessage);
      break;
  }
};