import { createSuiReadClient, getBoardRegistrySnapshot, type GraphQLClientConfig } from "@bounty-board/frontier-client";
import { BOUNTY_EVENT_STREAMS } from "./constants";
import { loadOracleConfig } from "./config";
import { OracleStore, oracleStreamKeys } from "./db/store";
import { startHealthServer } from "./http";
import { syncKillmail, syncLifecycle } from "./sync";
import { OracleWriter } from "./writer";

function logInfo(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[oracle] ${message}`, details);
    return;
  }

  console.info(`[oracle] ${message}`);
}

function logError(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.error(`[oracle] ${message}`, details);
    return;
  }

  console.error(`[oracle] ${message}`);
}

async function main() {
  const config = loadOracleConfig();
  const store = new OracleStore(config.dbPath);
  const writer = new OracleWriter(config);
  const suiReadClient = createSuiReadClient(config.grpcUrl);
  const graphQLConfig: GraphQLClientConfig = {
    endpoint: config.graphQLEndpoint
  };
  const streamKeys = oracleStreamKeys(BOUNTY_EVENT_STREAMS.map((eventName) => `bounty_board.${eventName}`));
  const server = startHealthServer(store, config.healthPort, streamKeys);
  let idleCycles = 0;

  logInfo("oracle started", {
    network: config.network,
    graphQLEndpoint: config.graphQLEndpoint,
    grpcUrl: config.grpcUrl,
    worldPackageId: config.worldPackageId,
    bountyBoardPackageId: config.bountyBoardPackageId,
    boardId: config.boardId,
    oracleCapId: config.oracleCapId,
    dbPath: config.dbPath,
    pollIntervalMs: config.pollIntervalMs,
    graphQLPageSize: config.graphQLPageSize,
    healthPort: config.healthPort
  });

  const boardSnapshot = await getBoardRegistrySnapshot(suiReadClient, {
    boardId: config.boardId
  });
  store.replaceActiveIndexes({
    singles: boardSnapshot.singles.map((record) => ({ ...record, createdAtMs: 0 })),
    multis: boardSnapshot.multis.map((record) => ({ ...record, createdAtMs: 0 })),
    insurances: boardSnapshot.insurances.map((record) => ({ ...record, createdAtMs: 0 }))
  });
  logInfo("board calibration completed", {
    boardId: boardSnapshot.board.objectId,
    schemaVersion: boardSnapshot.board.schemaVersion,
    singles: boardSnapshot.singles.length,
    multis: boardSnapshot.multis.length,
    insurances: boardSnapshot.insurances.length
  });

  let stopped = false;
  const shutdown = () => {
    if (stopped) {
      return;
    }

    stopped = true;
    server.stop(true);
    store.close();
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(0);
  });

  try {
    while (true) {
      try {
        const lifecycle = await syncLifecycle(store, config, graphQLConfig);
        const killmail = await syncKillmail(store, writer, config, graphQLConfig, {
          suiReadClient,
          logInfo,
          logError
        });
        store.clearLastError();

        const lifecycleTotal = Object.values(lifecycle.perStreamCounts).reduce((sum, count) => sum + count, 0);
        if (lifecycleTotal > 0 || killmail.killmailCount > 0 || killmail.actionCount > 0) {
          idleCycles = 0;
          logInfo("sync cycle", {
            lifecycleTotal,
            lifecycleStreams: lifecycle.perStreamCounts,
            killmailCount: killmail.killmailCount,
            actionCount: killmail.actionCount
          });
        }

        if (!lifecycle.didWork && !killmail.didWork) {
          idleCycles += 1;
          if (idleCycles === 1 || idleCycles % 12 === 0) {
            logInfo("idle heartbeat", {
              pollIntervalMs: config.pollIntervalMs,
              active: store.health(streamKeys).active
            });
          }
          await Bun.sleep(config.pollIntervalMs);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        store.setLastError(message);
        logError("sync error", { message });
        await Bun.sleep(config.pollIntervalMs);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.setLastError(message);
    logError("fatal error", { message });
    shutdown();
    throw error;
  }
}

await main();
