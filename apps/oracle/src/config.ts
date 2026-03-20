import { utopiaEnvironment } from "@bounty-board/frontier-client";
import { CLOCK_OBJECT_ID } from "./constants";
import type { OracleConfig } from "./types";

function envValue(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function requireEnv(name: string, fallback?: string) {
  const value = envValue(name, fallback);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePositiveInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return parsed;
}

function resolveBountyBoardPackageId() {
  const fallback = utopiaEnvironment.bountyBoardPackageId;
  return requireEnv("BOUNTY_BOARD_PACKAGE_ID", envValue("VITE_BOUNTY_BOARD_PACKAGE", fallback) ?? undefined);
}

export function loadOracleConfig(): OracleConfig {
  return {
    graphQLEndpoint: requireEnv("UTOPIA_GRAPHQL_URL", envValue("VITE_SUI_GRAPHQL_URL", utopiaEnvironment.graphqlUrl) ?? undefined),
    grpcUrl: requireEnv("SUI_GRPC_URL", "https://fullnode.testnet.sui.io:443"),
    worldPackageId: requireEnv("WORLD_PACKAGE_ID", envValue("VITE_WORLD_PACKAGE", utopiaEnvironment.worldPackageId) ?? undefined),
    worldObjectRegistryId: requireEnv("WORLD_OBJECT_REGISTRY_ID"),
    bountyBoardPackageId: resolveBountyBoardPackageId(),
    boardId: requireEnv("BOARD_ID"),
    oracleCapId: requireEnv("ORACLE_CAP_ID"),
    oraclePrivateKey: requireEnv("ORACLE_PRIVATE_KEY"),
    dbPath: requireEnv("ORACLE_DB_PATH", ".data/oracle.db"),
    pollIntervalMs: parsePositiveInt("ORACLE_POLL_INTERVAL_MS", 5_000),
    graphQLPageSize: parsePositiveInt("ORACLE_GRAPHQL_PAGE_SIZE", 50),
    healthPort: parsePositiveInt("ORACLE_HEALTH_PORT", 4318),
    clockObjectId: requireEnv("CLOCK_OBJECT_ID", CLOCK_OBJECT_ID),
    network: "testnet"
  };
}
