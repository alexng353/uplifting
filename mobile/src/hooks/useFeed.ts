import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

const FEED_LIMIT = 20;

export function useFeed() {
	return useInfiniteQuery({
		queryKey: ["feed"],
		queryFn: async ({ pageParam = 0 }) => {
			const { data, error } = await api.getFeed({
				query: { offset: pageParam, limit: FEED_LIMIT },
			});
			if (error || !data) {
				throw new Error("Failed to fetch feed");
			}
			return data;
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
