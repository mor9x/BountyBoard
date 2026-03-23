import { describe, expect, test } from "bun:test";
import type { KillmailEvent } from "@bounty-board/frontier-client";
import { LOSS_ANY, LOSS_SHIP, LOSS_STRUCTURE } from "../src/constants";
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

const baseEvent: KillmailEvent = {
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

describe("matchKillmailEvent", () => {
  test("matches AnyLoss and ShipOnly records for a ship kill", () => {
    const snapshot: ActiveIndexSnapshot = {
      singles: [
        {
          objectId: "0xsingle-any",
          target: { itemId: 22, tenant: "UTOPIA" },
          lossFilter: LOSS_ANY,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 1
        },
        {
          objectId: "0xsingle-structure",
          target: { itemId: 22, tenant: "UTOPIA" },
          lossFilter: LOSS_STRUCTURE,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 1
        }
      ],
      multis: [
        {
          objectId: "0xmulti-ship",
          target: { itemId: 22, tenant: "UTOPIA" },
          lossFilter: LOSS_SHIP,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 1,
          targetKills: 10,
          recordedKills: 3,
          perKillReward: 100
        }
      ],
      insurances: []
    };

    const actions = matchKillmailEvent(config, snapshot, baseEvent, 0);
    expect(actions.map((action) => action.objectId)).toEqual(["0xsingle-any", "0xmulti-ship"]);
  });
});
