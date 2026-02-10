import { QueryClient } from "@tanstack/react-query";
import { isRetryableQueryError } from "./isRetryableQueryError";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: (failureCount, error) => {
          if (failureCount >= 3) return false;
          return isRetryableQueryError(error);
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
