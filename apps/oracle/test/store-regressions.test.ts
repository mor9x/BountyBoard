import { describe, expect, test } from "bun:test";
import type { BountyBoardLifecycleEvent } from "@bounty-board/frontier-client";
import { OracleStore } from "../src/db/store";

describe("OracleStore regressions", () => {
  test("keeps zero-valued tenant item ids when hydrating lifecycle indexes", () => {
    const store = new OracleStore(":memory:");

    const singleEvent: BountyBoardLifecycleEvent = {
      kind: "SingleBountyCreatedEvent",
      eventType: "0xbounty::bounty_board::SingleBountyCreatedEvent",
      timestamp: "2026-03-21T00:00:00Z",
      digest: "0xdigest",
      bountyId: "0xsingle-zero",
      boardId: "0xboard",
      targetKey: { itemId: 0, tenant: "UTOPIA" },
      lossFilter: 0,
      coinType: "0x2::sui::SUI",
      expiresAtMs: 123,
      note: "note"
    };

    const multiEvent: BountyBoardLifecycleEvent = {
      kind: "MultiBountyCreatedEvent",
      eventType: "0xbounty::bounty_board::MultiBountyCreatedEvent",
      timestamp: "2026-03-21T00:00:00Z",
      digest: "0xdigest",
      bountyId: "0xmulti-zero",
      boardId: "0xboard",
      targetKey: { itemId: 0, tenant: "UTOPIA" },
      lossFilter: 0,
      targetKills: 2,
      perKillReward: 50,
      coinType: "0x2::sui::SUI",
      expiresAtMs: 456,
      note: "note"
    };

    const insuranceEvent: BountyBoardLifecycleEvent = {
      kind: "InsuranceCreatedEvent",
      eventType: "0xbounty::bounty_board::InsuranceCreatedEvent",
      timestamp: "2026-03-21T00:00:00Z",
      digest: "0xdigest",
      orderId: "0xinsurance-zero",
      boardId: "0xboard",
      insuredKey: { itemId: 0, tenant: "UTOPIA" },
      lossFilter: 0,
      spawnMode: 1,
      spawnTargetKills: 1,
      coinType: "0x2::sui::SUI",
      expiresAtMs: 789,
      note: "note"
    };

    store.applyLifecycleEvent("bounty_board.SingleBountyCreatedEvent", "cursor-1", singleEvent);
    store.applyLifecycleEvent("bounty_board.MultiBountyCreatedEvent", "cursor-2", multiEvent);
    store.applyLifecycleEvent("bounty_board.InsuranceCreatedEvent", "cursor-3", insuranceEvent);

    const snapshot = store.snapshot();

    expect(snapshot.singles).toEqual([
      {
        objectId: "0xsingle-zero",
        target: { itemId: 0, tenant: "UTOPIA" },
        lossFilter: 0,
        coinType: "0x2::sui::SUI",
        expiresAtMs: 123
      }
    ]);
    expect(snapshot.multis[0]).toMatchObject({
      objectId: "0xmulti-zero",
      target: { itemId: 0, tenant: "UTOPIA" },
      targetKills: 2,
      perKillReward: 50
    });
    expect(snapshot.insurances[0]).toMatchObject({
      objectId: "0xinsurance-zero",
      insured: { itemId: 0, tenant: "UTOPIA" },
      spawnMode: 1,
      spawnTargetKills: 1
    });

    store.close();
  });
});
