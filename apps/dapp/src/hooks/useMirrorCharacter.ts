import type { WalletCharacter } from "@bounty-board/frontier-client";
import { useQuery } from "@tanstack/react-query";
import { frontierClient } from "../lib/frontier";

export function useMirrorCharacter(character: WalletCharacter | null) {
  const environment = frontierClient.environment;

  return useQuery({
    queryKey: ["mirror-character", character?.itemId, character?.tenant],
    enabled: Boolean(character?.itemId && character?.tenant),
    queryFn: async () =>
      frontierClient.getCharacterByItemId({
        worldPackageId: environment.simulationWorldPackageId,
        worldObjectRegistryId: environment.simulationWorldObjectRegistryId,
        itemId: character!.itemId,
        tenant: character!.tenant
      })
  });
}
