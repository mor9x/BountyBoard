import { useQuery } from "@tanstack/react-query";
import { frontierClient } from "../lib/frontier";
import { useAppConnection } from "./useAppConnection";

export function useWalletCharacters() {
  const { walletAddress } = useAppConnection();

  return useQuery({
    queryKey: ["wallet-characters", walletAddress],
    enabled: Boolean(walletAddress),
    queryFn: async () =>
      frontierClient.queryWalletCharacters({
        owner: walletAddress!,
        worldPackageId: frontierClient.environment.identityWorldPackageId
      })
  });
}
