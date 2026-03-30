import { useQuery } from "@tanstack/react-query";
import { queryKillmailEvents, utopiaEnvironment } from "@bounty-board/frontier-client";

const FEED_PAGE_SIZE = 25;
const FEED_MAX_PAGES = 8;
const FEED_LIMIT = 10;

function eventOccurredAtMs(event: { killTimestamp: number | null; timestamp: string | null }) {
  if (typeof event.killTimestamp === "number" && Number.isFinite(event.killTimestamp)) {
    return event.killTimestamp >= 1_000_000_000_000 ? event.killTimestamp : event.killTimestamp * 1000;
  }

  if (event.timestamp) {
    const parsed = Date.parse(event.timestamp);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export function useKillmailEvents() {
  return useQuery({
    queryKey: ["killmail-events", utopiaEnvironment.simulationWorldPackageId],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const allEvents = [];
      let after: string | null = null;

      for (let pageIndex = 0; pageIndex < FEED_MAX_PAGES; pageIndex += 1) {
        const page = await queryKillmailEvents(
          { endpoint: utopiaEnvironment.graphqlUrl },
          {
            packageId: utopiaEnvironment.simulationWorldPackageId,
            first: FEED_PAGE_SIZE,
            after
          }
        );

        allEvents.push(...page.nodes);

        if (!page.pageInfo.hasNextPage || !page.pageInfo.endCursor || page.pageInfo.endCursor === after) {
          break;
        }

        after = page.pageInfo.endCursor;
      }

      const nodes = [...allEvents]
        .sort((left, right) => eventOccurredAtMs(right) - eventOccurredAtMs(left))
        .slice(0, FEED_LIMIT);

      return {
        nodes,
        edges: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      };
    },
    enabled: Boolean(utopiaEnvironment.simulationWorldPackageId)
  });
}
