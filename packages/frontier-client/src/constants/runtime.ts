type RuntimeEnv = Record<string, string | undefined>;

const viteEnv: RuntimeEnv =
  typeof import.meta !== "undefined"
    ? {
        VITE_FRONTIER_ENVIRONMENT: import.meta.env.VITE_FRONTIER_ENVIRONMENT,
        VITE_SUI_NETWORK: import.meta.env.VITE_SUI_NETWORK,
        VITE_SUI_GRAPHQL_URL: import.meta.env.VITE_SUI_GRAPHQL_URL,
        VITE_SUI_RPC_URL: import.meta.env.VITE_SUI_RPC_URL,
        VITE_WORLD_API_URL: import.meta.env.VITE_WORLD_API_URL,
        VITE_WORLD_PACKAGE: import.meta.env.VITE_WORLD_PACKAGE,
        VITE_WORLD_OBJECT_REGISTRY_ID: import.meta.env.VITE_WORLD_OBJECT_REGISTRY_ID,
        VITE_BOUNTY_BOARD_PACKAGE: import.meta.env.VITE_BOUNTY_BOARD_PACKAGE,
        VITE_BOARD_ID: import.meta.env.VITE_BOARD_ID,
        VITE_CLOCK_OBJECT_ID: import.meta.env.VITE_CLOCK_OBJECT_ID,
        VITE_SIMULATION_WORLD_PACKAGE: import.meta.env.VITE_SIMULATION_WORLD_PACKAGE,
        VITE_SIMULATION_WORLD_ADMIN_ACL_ID: import.meta.env.VITE_SIMULATION_WORLD_ADMIN_ACL_ID,
        VITE_SIMULATION_WORLD_KILLMAIL_REGISTRY_ID: import.meta.env.VITE_SIMULATION_WORLD_KILLMAIL_REGISTRY_ID,
        VITE_CUSTOM_COIN_TYPE_HINT: import.meta.env.VITE_CUSTOM_COIN_TYPE_HINT,
        VITE_SUPPORTED_TOKENS_JSON: import.meta.env.VITE_SUPPORTED_TOKENS_JSON
      }
    : {};

export function getRuntimeEnv(): RuntimeEnv {
  const nodeEnv =
    typeof process !== "undefined" && process.env
      ? (process.env as RuntimeEnv)
      : {};

  return {
    ...nodeEnv,
    ...viteEnv
  };
}

export function env(name: string) {
  const value = getRuntimeEnv()[name];
  return typeof value === "string" && value.length > 0 ? value : null;
}
