import { useQuery } from "@tanstack/react-query";
import type { DeliveredPostcard } from "./postcard";
import { SAMPLE_POSTCARD } from "./postcard";

/**
 * The one thing the preview page reads.
 *
 * There is no endpoint for a delivered card yet, so this resolves the sample
 * and nothing else. It is a query rather than a constant on purpose: when the
 * backend pass lands, the fetch goes in here, the screen keeps reading
 * `postcard` and `pending`, and nothing in `src/screens/preview` is touched.
 */
export function usePostcard(id = "sample") {
  const { data, isPending, isError } = useQuery({
    queryKey: ["postcard", id],
    queryFn: async (): Promise<DeliveredPostcard> => SAMPLE_POSTCARD,
    staleTime: Infinity,
  });

  return { postcard: data, pending: isPending, failed: isError };
}
