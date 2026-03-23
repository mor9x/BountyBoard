import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { utopiaEnvironment } from "../constants";

export type SuiReadClient = Pick<SuiJsonRpcClient, "getObject" | "getCoins">;

export function createSuiReadClient(rpcUrl: string = utopiaEnvironment.suiRpcUrl): SuiReadClient {
  return new SuiJsonRpcClient({
    network: utopiaEnvironment.network,
    url: rpcUrl
  });
}
