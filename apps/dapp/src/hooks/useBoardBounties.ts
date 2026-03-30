import type { MirrorCharacterLookup } from "@bounty-board/frontier-client";
import { useQuery } from "@tanstack/react-query";
import { frontierClient } from "../lib/frontier";
import { snapshotToCards } from "../lib/bounty-view";

async function getFutureKillerBountyIds(packageId: string) {
  const futureKillerBountyIds = new Set<string>();
  let after: string | null = null;

  while (true) {
    const page = await frontierClient.queryBountyBoardEvents({
      packageId,
      eventName: "InsuranceTriggeredEvent",
      first: 100,
      after
    });

    for (const event of page.nodes) {
      if (event.kind === "InsuranceTriggeredEvent" && event.generatedBountyId) {
        futureKillerBountyIds.add(event.generatedBountyId);
      }
    }

    if (!page.pageInfo.hasNextPage || !page.pageInfo.endCursor) {
      break;
    }

    if (page.pageInfo.endCursor === after) {
      break;
    }

    after = page.pageInfo.endCursor;
  }

  return futureKillerBountyIds;
}

export function useBoardBounties(selectedCharacter: MirrorCharacterLookup | null) {
  const environment = frontierClient.environment;

  return useQuery({
    queryKey: ["board-snapshot", environment.boardId, environment.bountyBoardPackageId, selectedCharacter?.itemId, selectedCharacter?.tenant],
    enabled: Boolean(environment.boardId),
    refetchInterval: 2500,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const snapshot = await frontierClient.getBoardRegistrySnapshot({
        boardId: environment.boardId
      });
      const futureKillerBountyIds = await getFutureKillerBountyIds(environment.bountyBoardPackageId).catch(() => new Set<string>());

      return {
        snapshot,
        cards: snapshotToCards(snapshot, selectedCharacter, futureKillerBountyIds)
      };
    }
  });
}
