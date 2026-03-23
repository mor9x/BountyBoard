import { useQuery } from "@tanstack/react-query";
import { queryKillmailEvents, utopiaEnvironment } from "@bounty-board/frontier-client";

export function useKillmailEvents() {
  return useQuery({
    queryKey: ["killmail-events", utopiaEnvironment.simulationWorldPackageId],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    queryFn: () =>
      queryKillmailEvents(
        { endpoint: utopiaEnvironment.graphqlUrl },
        {
          packageId: utopiaEnvironment.simulationWorldPackageId,
          first: 10
        }
      ),
    enabled: Boolean(utopiaEnvironment.simulationWorldPackageId)
  });
}
