import type { GraphQLClientConfig } from "@bounty-board/frontier-client";
import { BOUNTY_EVENT_STREAMS, KILLMAIL_STREAM } from "./constants";
import { loadOracleConfig } from "./config";
import { buildProcessedActionKey, type OracleStore } from "./db/store";
import { fetchKillmailPage, type KillmailPage } from "./feed/killmail";
import { buildLifecycleStreams, fetchLifecyclePage, type LifecyclePage } from "./feed/lifecycle";
import { matchKillmailEvent } from "./matcher";
import { isLikelyOracleActionConflict, isOracleActionResolvedOnChain } from "./reconciliation";
import type { LifecycleStream } from "./types";
import { OracleWriteError, type OracleWriter } from "./writer";
import type { SuiReadClient } from "@bounty-board/frontier-client";

export type LifecycleSyncResult = {
  didWork: boolean;
  perStreamCounts: Record<string, number>;
};

export type KillmailSyncResult = {
  didWork: boolean;
  killmailCount: number;
  actionCount: number;
};

type SyncLogger = (message: string, details?: Record<string, unknown>) => void;

type SyncLifecycleOptions = {
  fetchPage?: (
    config: ReturnType<typeof loadOracleConfig>,
    graphQLConfig: GraphQLClientConfig,
    stream: LifecycleStream,
    cursor: string | null
  ) => Promise<LifecyclePage>;
  streams?: LifecycleStream[];
};

type SyncKillmailOptions = {
  fetchPage?: (
    config: ReturnType<typeof loadOracleConfig>,
    graphQLConfig: GraphQLClientConfig,
    cursor: string | null
  ) => Promise<KillmailPage>;
  suiReadClient?: SuiReadClient;
  nowMs?: number;
  logInfo?: SyncLogger;
  logError?: SyncLogger;
};

type OracleActionWriter = Pick<OracleWriter, "execute">;

function actionSummary(action: ReturnType<typeof matchKillmailEvent>[number]) {
  if (action.kind === "settle-single") {
    return {
      kind: action.kind,
      objectId: action.objectId,
      killmailItemId: action.killmailItemId,
      hunterCharacterObjectId: action.hunterCharacterObjectId
    };
  }

  if (action.kind === "record-multi-kill") {
    return {
      kind: action.kind,
      objectId: action.objectId,
      killmailItemId: action.killmailItemId,
      hunterCharacterObjectId: action.hunterCharacterObjectId,
      nextRecordedKills: action.nextRecordedKills,
      targetKills: action.targetKills
    };
  }

  return {
    kind: action.kind,
    objectId: action.objectId,
    killmailItemId: action.killmailItemId,
    killerCharacterObjectId: action.killerCharacterObjectId
  };
}

function nextPageCursor(currentCursor: string | null, page: { hasNextPage: boolean; endCursor: string | null }) {
  if (!page.hasNextPage || page.endCursor == null || page.endCursor === currentCursor) {
    return null;
  }

  return page.endCursor;
}

export async function syncLifecycle(
  store: OracleStore,
  config: ReturnType<typeof loadOracleConfig>,
  graphQLConfig: GraphQLClientConfig,
  options: SyncLifecycleOptions = {}
): Promise<LifecycleSyncResult> {
  const fetchPage = options.fetchPage ?? fetchLifecyclePage;
  const streams = options.streams ?? buildLifecycleStreams(BOUNTY_EVENT_STREAMS);
  let didWork = false;
  const perStreamCounts: Record<string, number> = {};

  for (const stream of streams) {
    let streamCursor = store.getCursor(stream.streamKey);
    let streamCount = 0;

    while (true) {
      const page = await fetchPage(config, graphQLConfig, stream, streamCursor);
      streamCount += page.edges.length;

      for (const edge of page.edges) {
        store.applyLifecycleEvent(stream.streamKey, edge.cursor, edge.event);
        didWork = true;
      }

      const followingCursor = nextPageCursor(streamCursor, page);
      if (!followingCursor) {
        break;
      }

      streamCursor = followingCursor;
    }

    perStreamCounts[stream.streamKey] = streamCount;
  }

  return { didWork, perStreamCounts };
}

export async function syncKillmail(
  store: OracleStore,
  writer: OracleActionWriter,
  config: ReturnType<typeof loadOracleConfig>,
  graphQLConfig: GraphQLClientConfig,
  options: SyncKillmailOptions = {}
): Promise<KillmailSyncResult> {
  const fetchPage = options.fetchPage ?? fetchKillmailPage;
  const suiReadClient = options.suiReadClient;
  const nowMs = options.nowMs ?? Date.now();
  let didWork = false;
  let actionCount = 0;
  let killmailCount = 0;
  let cursor = store.getCursor(KILLMAIL_STREAM);

  while (true) {
    const page = await fetchPage(config, graphQLConfig, cursor);
    killmailCount += page.edges.length;

    for (const edge of page.edges) {
      const actions = matchKillmailEvent(config, store.snapshot(), edge.event, nowMs);

      for (const action of actions) {
        const actionKey = buildProcessedActionKey(action);
        if (store.hasProcessedAction(actionKey)) {
          continue;
        }

        try {
          options.logInfo?.("writing oracle action", actionSummary(action));
          const digest = await writer.execute(action);
          options.logInfo?.("oracle write succeeded", {
            kind: action.kind,
            objectId: action.objectId,
            killmailItemId: action.killmailItemId,
            digest
          });
          store.recordSuccessfulAction(action, digest);
          actionCount += 1;
          didWork = true;
        } catch (error) {
          if (error instanceof OracleWriteError && suiReadClient) {
            const shouldConfirmOnChain = !error.retryable || isLikelyOracleActionConflict(error.message);

            if (shouldConfirmOnChain) {
              try {
                const resolved = await isOracleActionResolvedOnChain(suiReadClient, action, nowMs);
                if (resolved) {
                  options.logInfo?.("oracle action resolved by current on-chain state", actionSummary(action));
                  continue;
                }
              } catch (confirmationError) {
                options.logError?.("oracle action reconciliation failed", {
                  ...actionSummary(action),
                  message: confirmationError instanceof Error ? confirmationError.message : String(confirmationError)
                });
              }
            }
          }

          if (error instanceof OracleWriteError && !error.retryable) {
            options.logError?.("oracle action skipped after terminal failure", {
              ...actionSummary(action),
              message: error.message
            });
            continue;
          }

          throw error;
        }
      }

      store.recordKillmailProcessed(edge.cursor);
      didWork = true;
    }

    const followingCursor = nextPageCursor(cursor, page);
    if (!followingCursor) {
      break;
    }

    cursor = followingCursor;
  }

  return {
    didWork,
    killmailCount,
    actionCount
  };
}
