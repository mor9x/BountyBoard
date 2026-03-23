import { describe, expect, test } from "bun:test";
import type { BountyBoardLifecycleEvent, KillmailEvent } from "@bounty-board/frontier-client";
import { KILLMAIL_STREAM } from "../src/constants";
import { buildProcessedActionKey, OracleStore } from "../src/db/store";
import { syncKillmail, syncLifecycle } from "../src/sync";
import type { OracleConfig } from "../src/types";
import { OracleWriteError } from "../src/writer";

const config: OracleConfig = {
  graphQLEndpoint: "https://example.com/graphql",
  grpcUrl: "https://fullnode.testnet.sui.io:443",
  worldPackageId: "0x2222222222222222222222222222222222222222222222222222222222222222",
  worldObjectRegistryId: "0x1111111111111111111111111111111111111111111111111111111111111111",
  bountyBoardPackageId: "0xbounty",
  boardId: "0xboard",
  oracleCapId: "0xoraclecap",
  oraclePrivateKey: "suiprivkey1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5jzy8w",
  dbPath: ":memory:",
  pollIntervalMs: 1_000,
  graphQLPageSize: 10,
  healthPort: 4318,
  clockObjectId: "0x6",
  network: "testnet"
};

const graphQLConfig = {
  endpoint: "https://example.com/graphql"
};

function createKillmailEvent(killmailItemId: number, victimItemId: number): KillmailEvent {
  return {
    eventType: "0xworld::killmail::KillmailCreatedEvent",
    timestamp: "2026-03-21T00:00:00Z",
    digest: `0xdigest-${killmailItemId}`,
    killmailItemId,
    killerId: { itemId: 44, tenant: "UTOPIA" },
    victimId: { itemId: victimItemId, tenant: "UTOPIA" },
    reportedByCharacterId: { itemId: 77, tenant: "UTOPIA" },
    solarSystemId: { itemId: 88, tenant: "UTOPIA" },
    lossType: "SHIP",
    killTimestamp: 1_710_000_000,
    contentsJson: {}
  };
}

describe("oracle sync", () => {
  test("drains lifecycle pages until the stream is fully caught up", async () => {
    const store = new OracleStore(":memory:");
    let calls = 0;

    const result = await syncLifecycle(store, config, graphQLConfig, {
      streams: [{ streamKey: "bounty_board.SingleBountyCreatedEvent", eventName: "SingleBountyCreatedEvent" }],
      fetchPage: async (_config, _graphQLConfig, _stream, cursor) => {
        calls += 1;

        const firstEvent: BountyBoardLifecycleEvent = {
          kind: "SingleBountyCreatedEvent",
          eventType: "0xbounty::bounty_board::SingleBountyCreatedEvent",
          timestamp: "2026-03-21T00:00:00Z",
          digest: "0xdigest-1",
          bountyId: "0xsingle-1",
          boardId: "0xboard",
          targetKey: { itemId: 22, tenant: "UTOPIA" },
          lossFilter: 0,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 123,
          note: "note-1"
        };

        const secondEvent: BountyBoardLifecycleEvent = {
          kind: "SingleBountyCreatedEvent",
          eventType: "0xbounty::bounty_board::SingleBountyCreatedEvent",
          timestamp: "2026-03-21T00:00:01Z",
          digest: "0xdigest-2",
          bountyId: "0xsingle-2",
          boardId: "0xboard",
          targetKey: { itemId: 23, tenant: "UTOPIA" },
          lossFilter: 0,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 456,
          note: "note-2"
        };

        if (cursor === null) {
          return {
            edges: [{ cursor: "cursor-1", event: firstEvent }],
            hasNextPage: true,
            endCursor: "cursor-1"
          };
        }

        return {
          edges: [{ cursor: "cursor-2", event: secondEvent }],
          hasNextPage: false,
          endCursor: "cursor-2"
        };
      }
    });

    expect(calls).toBe(2);
    expect(result.perStreamCounts["bounty_board.SingleBountyCreatedEvent"]).toBe(2);
    expect(store.snapshot().singles.map((record) => record.objectId)).toEqual(["0xsingle-1", "0xsingle-2"]);
    expect(store.getCursor("bounty_board.SingleBountyCreatedEvent")).toBe("cursor-2");

    store.close();
  });

  test("drains all killmail pages before returning", async () => {
    const store = new OracleStore(":memory:");
    let calls = 0;

    const result = await syncKillmail(
      store,
      {
        execute: async () => {
          throw new Error("execute should not be called for unmatched killmails");
        }
      },
      config,
      graphQLConfig,
      {
        nowMs: 1_000,
        fetchPage: async (_config, _graphQLConfig, cursor) => {
          calls += 1;

          if (cursor === null) {
            return {
              edges: [{ cursor: "cursor-1", event: createKillmailEvent(1, 100) }],
              hasNextPage: true,
              endCursor: "cursor-1"
            };
          }

          return {
            edges: [{ cursor: "cursor-2", event: createKillmailEvent(2, 200) }],
            hasNextPage: false,
            endCursor: "cursor-2"
          };
        }
      }
    );

    expect(calls).toBe(2);
    expect(result.killmailCount).toBe(2);
    expect(store.getCursor(KILLMAIL_STREAM)).toBe("cursor-2");

    store.close();
  });

  test("skips terminal write failures and continues with later killmails", async () => {
    const store = new OracleStore(":memory:");

    store.replaceActiveIndexes({
      singles: [
        {
          objectId: "0xsingle-fail",
          target: { itemId: 22, tenant: "UTOPIA" },
          lossFilter: 0,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 10_000
        },
        {
          objectId: "0xsingle-success",
          target: { itemId: 23, tenant: "UTOPIA" },
          lossFilter: 0,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 10_000
        }
      ],
      multis: [],
      insurances: []
    });

    const result = await syncKillmail(
      store,
      {
        execute: async (action) => {
          if (action.objectId === "0xsingle-fail") {
            throw new OracleWriteError("move abort", { retryable: false });
          }

          return "0xsuccess";
        }
      },
      config,
      graphQLConfig,
      {
        nowMs: 1_000,
        fetchPage: async () => ({
          edges: [
            { cursor: "cursor-1", event: createKillmailEvent(1, 22) },
            { cursor: "cursor-2", event: createKillmailEvent(2, 23) }
          ],
          hasNextPage: false,
          endCursor: "cursor-2"
        })
      }
    );

    const successfulAction = {
      kind: "settle-single" as const,
      objectId: "0xsingle-success",
      coinType: "0x2::sui::SUI",
      hunterCharacterObjectId:
        "0x6650354be175d7c0f8f6329a6b1f1c5f8cfdf97739dcf5ed4d3d0a50d4f17f4e",
      killmailItemId: 2
    };

    expect(result.killmailCount).toBe(2);
    expect(result.actionCount).toBe(1);
    expect(store.getCursor(KILLMAIL_STREAM)).toBe("cursor-2");
    expect(store.hasProcessedAction(buildProcessedActionKey(successfulAction))).toBe(true);

    store.close();
  });
});
