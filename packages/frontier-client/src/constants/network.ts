import { generatedIds } from "./generated";

const { bountyBoardPackageId: generatedBountyBoardPackageId } = generatedIds;

type RuntimeEnv = Record<string, string | undefined>;

function getRuntimeEnv(): RuntimeEnv {
  const nodeEnv =
    typeof process !== "undefined" && process.env
      ? (process.env as RuntimeEnv)
      : {};
  const viteEnv =
    typeof import.meta !== "undefined" && "env" in import.meta
      ? ((import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {})
      : {};

  return {
    ...nodeEnv,
    ...viteEnv
  };
}

function env(name: string, fallback: string) {
  return getRuntimeEnv()[name] ?? fallback;
}

const identityWorldPackageId = env(
  "VITE_IDENTITY_WORLD_PACKAGE",
  env("VITE_EVE_WORLD_PACKAGE_ID", "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75")
);
const simulationWorldPackageId = env(
  "VITE_SIMULATION_WORLD_PACKAGE",
  env("VITE_WORLD_PACKAGE", "0x92ab3121df7123046563e249f1064c9dc5ec42c8f5143973a8ea682315a033da")
);
const bountyBoardPackageId = env("VITE_BOUNTY_BOARD_PACKAGE", generatedBountyBoardPackageId);

export const utopiaEnvironment = {
  network: env("VITE_SUI_NETWORK", "testnet"),
  graphqlUrl: env("VITE_SUI_GRAPHQL_URL", "https://graphql.testnet.sui.io/graphql"),
  suiRpcUrl: env("VITE_SUI_RPC_URL", "https://fullnode.testnet.sui.io:443"),
  worldApiUrl: env("VITE_WORLD_API_URL", "https://world-api-utopia.uat.pub.evefrontier.com"),
  identityWorldPackageId,
  simulationWorldPackageId,
  simulationWorldObjectRegistryId: env(
    "VITE_SIMULATION_WORLD_OBJECT_REGISTRY_ID",
    env("WORLD_OBJECT_REGISTRY_ID", "0x469d5e94402f076c24c555368fb5e4fc029249fc719bcbda0aa2c2f83cd497d3")
  ),
  simulationWorldAdminAclId: env(
    "VITE_SIMULATION_WORLD_ADMIN_ACL_ID",
    env("WORLD_ADMIN_ACL_ID", "")
  ),
  simulationWorldKillmailRegistryId: env(
    "VITE_SIMULATION_WORLD_KILLMAIL_REGISTRY_ID",
    env("WORLD_KILLMAIL_REGISTRY_ID", "")
  ),
  bountyBoardPackageId,
  boardId: env("VITE_BOARD_ID", env("BOARD_ID", "")),
  clockObjectId: env("VITE_CLOCK_OBJECT_ID", env("CLOCK_OBJECT_ID", "0x6")),
  worldPackageId: simulationWorldPackageId,
  worldObjectRegistryId: env(
    "VITE_SIMULATION_WORLD_OBJECT_REGISTRY_ID",
    env("WORLD_OBJECT_REGISTRY_ID", "0x469d5e94402f076c24c555368fb5e4fc029249fc719bcbda0aa2c2f83cd497d3")
  )
} as const;
