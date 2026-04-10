import { useInfiniteQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

const FEED_LIMIT = 20;

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam = 0 }) => {
      return unwrap(
        await api.api.v1.friends.feed.get({
          query: { offset: String(pageParam), limit: String(FEED_LIMIT) },
        }),
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < FEED_LIMIT) {
        return undefined;
      }
      return allPages.flat().length;
    },
  });
}
