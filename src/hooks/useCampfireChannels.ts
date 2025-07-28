import { useQuery } from "@tanstack/react-query";
import { createError, ErrorCode, withErrorHandling } from "../lib/errors/errorHandling";

export interface Channel {
  id: string;
  name: string;
}

const fetchChannels = withErrorHandling(async (): Promise<Channel[]> => {
  const res = await fetch("/api/campfire/channels");
  if (!res.ok) {
    throw createError(ErrorCode.API_ERROR, `Failed to fetch channels: ${res.statusText}`);
  }
  return res.json();
});

export const useCampfireChannels = () => {
  const {
    data: channels = [],
    isLoading,
    isError,
    error,
  } = useQuery<Channel[], Error>({
    queryKey: ["campfireChannels"],
    queryFn: fetchChannels,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    channels,
    isLoading,
    isError,
    error,
  };
};
