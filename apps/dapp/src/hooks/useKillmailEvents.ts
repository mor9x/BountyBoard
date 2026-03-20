import { useQuery } from "@tanstack/react-query";
import { queryKillmailEvents, utopiaEnvironment } from "@bounty-board/frontier-client";

export function useKillmailEvents() {
  return useQuery({
    queryKey: ["killmail-events", utopiaEnvironment.worldPackageId],
    queryFn: () =>
      queryKillmailEvents(
        { endpoint: utopiaEnvironment.graphqlUrl },
        {
          packageId: utopiaEnvironment.worldPackageId,
          first: 10
        }
      ),
    enabled: Boolean(utopiaEnvironment.worldPackageId)
  });
}
