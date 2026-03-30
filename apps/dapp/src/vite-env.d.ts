/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUI_NETWORK?: string;
  readonly VITE_SUI_GRAPHQL_URL?: string;
  readonly VITE_SUI_RPC_URL?: string;
  readonly VITE_WORLD_API_URL?: string;
  readonly VITE_WORLD_PACKAGE?: string;
  readonly VITE_WORLD_OBJECT_REGISTRY_ID?: string;
  readonly VITE_BOUNTY_BOARD_PACKAGE?: string;
  readonly VITE_BOARD_ID?: string;
  readonly VITE_CLOCK_OBJECT_ID?: string;
  readonly VITE_SIMULATION_WORLD_PACKAGE?: string;
  readonly VITE_SIMULATION_WORLD_ADMIN_ACL_ID?: string;
  readonly VITE_SIMULATION_WORLD_KILLMAIL_REGISTRY_ID?: string;
  readonly VITE_CUSTOM_COIN_TYPE_HINT?: string;
  readonly VITE_SUPPORTED_TOKENS_JSON?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
