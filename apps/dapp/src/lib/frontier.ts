import { createFrontierClient, createSuiReadClient, utopiaEnvironment } from "@bounty-board/frontier-client";

export const frontierClient = createFrontierClient({
  endpoint: utopiaEnvironment.graphqlUrl,
  rpcUrl: utopiaEnvironment.suiRpcUrl
});

export const readClient = createSuiReadClient(utopiaEnvironment.suiRpcUrl);
