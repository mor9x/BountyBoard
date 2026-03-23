import { queryKillmailEvents } from "./queries/killmail";
import { queryBountyBoardEvents } from "./queries/bounty-board";
import { getCharacterByItemId } from "./queries/characters";
import { getBoardRegistrySnapshot, getBoardState } from "./queries/board-state";
import { queryWalletCharacters } from "./queries/wallet-characters";
import { utopiaEnvironment } from "./constants";
import type { GraphQLClientConfig } from "./graphql/client";
import { createSuiReadClient, type SuiReadClient } from "./rpc/client";
import type { QueryBountyBoardEventsArgs } from "./queries/bounty-board";
import type { GetBoardStateArgs } from "./queries/board-state";
import type { QueryWalletCharactersArgs } from "./queries/wallet-characters";
import type { QueryKillmailEventsArgs } from "./queries/killmail";
import type { ConnectionPage } from "./types/graphql";
import type { BountyBoardLifecycleEvent } from "./types/bounty-board";
import type { BoardState } from "./types/board-state";
import type { BoardRegistrySnapshot } from "./types/board-state";
import type { WalletCharacter } from "./types/character";
import type { KillmailEvent } from "./types/killmail";

export type FrontierClientConfig = Partial<GraphQLClientConfig> & {
  rpcUrl?: string;
  suiClient?: SuiReadClient;
};

export type FrontierClient = {
  environment: typeof utopiaEnvironment;
  queryKillmailEvents: (args: QueryKillmailEventsArgs) => Promise<ConnectionPage<KillmailEvent>>;
  queryBountyBoardEvents: (args: QueryBountyBoardEventsArgs) => Promise<ConnectionPage<BountyBoardLifecycleEvent>>;
  queryWalletCharacters: (args: QueryWalletCharactersArgs) => Promise<WalletCharacter[]>;
  getBoardState: (args: GetBoardStateArgs) => Promise<BoardState>;
  getBoardRegistrySnapshot: (args: GetBoardStateArgs) => Promise<BoardRegistrySnapshot>;
  getCharacterByItemId: (
    args: Parameters<typeof getCharacterByItemId>[1]
  ) => ReturnType<typeof getCharacterByItemId>;
};

export function createFrontierClient(config: FrontierClientConfig = {}): FrontierClient {
  const graphQLConfig: GraphQLClientConfig = {
    endpoint: config.endpoint ?? utopiaEnvironment.graphqlUrl,
    headers: config.headers
  };
  const suiClient = config.suiClient ?? createSuiReadClient(config.rpcUrl ?? utopiaEnvironment.suiRpcUrl);

  return {
    environment: utopiaEnvironment,
    queryKillmailEvents: (args) => queryKillmailEvents(graphQLConfig, args),
    queryBountyBoardEvents: (args) => queryBountyBoardEvents(graphQLConfig, args),
    queryWalletCharacters: (args) => queryWalletCharacters(graphQLConfig, args),
    getBoardState: (args) => getBoardState(suiClient, args),
    getBoardRegistrySnapshot: (args) => getBoardRegistrySnapshot(suiClient, args),
    getCharacterByItemId: (args) => getCharacterByItemId(suiClient, args)
  };
}

export { utopiaEnvironment } from "./constants";
export {
  formatAtomicAmount,
  getSupportedTokenByCoinType,
  getSupportedTokenBySymbol,
  parseDisplayAmountToAtomicUnits,
  supportedTokens
} from "./constants/tokens";
export { createSuiReadClient } from "./rpc/client";
export { getBountyBoardEventType, queryBountyBoardEvents } from "./queries/bounty-board";
export { getBoardRegistrySnapshot, getBoardState } from "./queries/board-state";
export { deriveCharacterObjectId, getCharacterByItemId } from "./queries/characters";
export { getKillmailCreatedEventType, queryKillmailEvents } from "./queries/killmail";
export { queryWalletCharacters } from "./queries/wallet-characters";
export {
  buildClaimMultiBountyTx,
  buildClaimSingleBountyTx,
  buildCreateInsuranceOrderTx,
  buildCreateMultiBountyTx,
  buildCreateSingleBountyTx,
  buildRefundInsuranceTx,
  buildRefundMultiBountyTx,
  buildRefundSingleBountyTx,
  LOSS_FILTER,
  SPAWN_MODE
} from "./transactions/bounty-board";
export { buildEmitKillmailTx, KILLMAIL_LOSS_TYPE } from "./transactions/killmail";
export type { BountyBoardEventName, BountyBoardLifecycleEvent } from "./types/bounty-board";
export type { ActiveInsuranceBoardRecord, ActiveMultiBoardRecord, ActiveSingleBoardRecord, BoardRegistrySnapshot, BoardState } from "./types/board-state";
export type { MirrorCharacterLookup, WalletCharacter } from "./types/character";
export type { KillmailEvent, TenantItemIdJson } from "./types/killmail";
export type { ConnectionEdge, ConnectionPage, PageInfo } from "./types/graphql";
export type { GraphQLClientConfig } from "./graphql/client";
export type { SuiReadClient } from "./rpc/client";
export type { SupportedToken } from "./constants/tokens";
