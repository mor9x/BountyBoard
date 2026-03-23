import { describe, expect, test } from "bun:test";
import type { KillmailEvent } from "@bounty-board/frontier-client";
import { LOSS_ANY } from "../src/constants";
import { matchKillmailEvent } from "../src/matcher";
import type { ActiveIndexSnapshot, OracleConfig } from "../src/types";

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

describe("matchKillmailEvent regressions", () => {
  test("accepts zero-valued ids instead of treating them as missing", () => {
    const snapshot: ActiveIndexSnapshot = {
      singles: [
        {
          objectId: "0xsingle-zero",
          target: { itemId: 0, tenant: "UTOPIA" },
          lossFilter: LOSS_ANY,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 10_000
        }
      ],
      multis: [],
      insurances: []
    };

    const event: KillmailEvent = {
      eventType: "0xworld::killmail::KillmailCreatedEvent",
      timestamp: "2026-03-21T00:00:00Z",
      digest: "0xdigest",
      killmailItemId: 0,
      killerId: { itemId: 0, tenant: "UTOPIA" },
      victimId: { itemId: 0, tenant: "UTOPIA" },
      reportedByCharacterId: { itemId: 77, tenant: "UTOPIA" },
      solarSystemId: { itemId: 88, tenant: "UTOPIA" },
      lossType: "SHIP",
      killTimestamp: 1_710_000_000,
      contentsJson: {}
    };

    const actions = matchKillmailEvent(config, snapshot, event, 1_000);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      kind: "settle-single",
      objectId: "0xsingle-zero",
      killmailItemId: 0
    });
  });

  test("ignores expired records before building oracle actions", () => {
    const snapshot: ActiveIndexSnapshot = {
      singles: [
        {
          objectId: "0xsingle-expired",
          target: { itemId: 22, tenant: "UTOPIA" },
          lossFilter: LOSS_ANY,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 999
        },
        {
          objectId: "0xsingle-live",
          target: { itemId: 22, tenant: "UTOPIA" },
          lossFilter: LOSS_ANY,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 5_000
        }
      ],
      multis: [],
      insurances: []
    };

    const event: KillmailEvent = {
      eventType: "0xworld::killmail::KillmailCreatedEvent",
      timestamp: "2026-03-21T00:00:00Z",
      digest: "0xdigest",
      killmailItemId: 99,
      killerId: { itemId: 44, tenant: "UTOPIA" },
      victimId: { itemId: 22, tenant: "UTOPIA" },
      reportedByCharacterId: { itemId: 77, tenant: "UTOPIA" },
      solarSystemId: { itemId: 88, tenant: "UTOPIA" },
      lossType: "SHIP",
      killTimestamp: 1_710_000_000,
      contentsJson: {}
    };

    const actions = matchKillmailEvent(config, snapshot, event, 1_000);

    expect(actions.map((action) => action.objectId)).toEqual(["0xsingle-live"]);
  });
});
