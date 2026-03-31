import { env } from "./runtime";

function normalizeEnvironmentName(value: string | null, worldApiUrl: string) {
  if (value) {
    return value.trim();
  }

  const normalizedUrl = worldApiUrl.toLowerCase();

  if (normalizedUrl.includes("stillness")) {
    return "Stillness";
  }

  if (normalizedUrl.includes("utopia")) {
    return "Utopia";
  }

  return "Utopia";
}

const identityWorldPackageId = env("VITE_WORLD_PACKAGE") ?? "";
const simulationWorldPackageId = env("VITE_SIMULATION_WORLD_PACKAGE") ?? "";
const bountyBoardPackageId = env("VITE_BOUNTY_BOARD_PACKAGE") ?? "";
const boardId = env("VITE_BOARD_ID") ?? "";
const worldObjectRegistryId = env("VITE_WORLD_OBJECT_REGISTRY_ID") ?? "";
const network = env("VITE_SUI_NETWORK") ?? "testnet";
const graphqlUrl = env("VITE_SUI_GRAPHQL_URL") ?? "https://graphql.testnet.sui.io/graphql";
const suiRpcUrl = env("VITE_SUI_RPC_URL") ?? "https://fullnode.testnet.sui.io:443";
const worldApiUrl = env("VITE_WORLD_API_URL") ?? "https://world-api-utopia.uat.pub.evefrontier.com";
const environmentName = normalizeEnvironmentName(env("VITE_FRONTIER_ENVIRONMENT"), worldApiUrl);

export const utopiaEnvironment = {
  environmentName,
  network,
  graphqlUrl,
  suiRpcUrl,
  worldApiUrl,
  identityWorldPackageId,
  simulationWorldPackageId,
  simulationWorldAdminAclId: env("VITE_SIMULATION_WORLD_ADMIN_ACL_ID") ?? "",
  simulationWorldKillmailRegistryId: env("VITE_SIMULATION_WORLD_KILLMAIL_REGISTRY_ID") ?? "",
  bountyBoardPackageId,
  boardId,
  clockObjectId: env("VITE_CLOCK_OBJECT_ID") ?? "0x6",
  worldPackageId: identityWorldPackageId,
  worldObjectRegistryId,
  customCoinTypeHint: env("VITE_CUSTOM_COIN_TYPE_HINT") ?? ""
} as const;
