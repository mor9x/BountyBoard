import { describe, expect, test } from "bun:test";
import type { BountyBoardLifecycleEvent } from "@bounty-board/frontier-client";
import { KILLMAIL_STREAM } from "../src/constants";
import { OracleStore, buildProcessedActionKey } from "../src/db/store";
import { withTransaction } from "../src/db/sqlite";

describe("OracleStore", () => {
  test("applies lifecycle events into active indexes", () => {
    const store = new OracleStore(":memory:");
    const event: BountyBoardLifecycleEvent = {
      kind: "SingleBountyCreatedEvent",
      eventType: "0xbounty::bounty_board::SingleBountyCreatedEvent",
      timestamp: "2026-03-21T00:00:00Z",
      digest: "0xdigest",
      bountyId: "0xpool",
      boardId: "0xboard",
      targetKey: { itemId: 22, tenant: "UTOPIA" },
      lossFilter: 0,
      coinType: "0x2::sui::SUI",
      expiresAtMs: 123,
      note: "note"
    };

    store.applyLifecycleEvent("bounty_board.SingleBountyCreatedEvent", "cursor-1", event);

    expect(store.getCursor("bounty_board.SingleBountyCreatedEvent")).toBe("cursor-1");
    expect(store.snapshot().singles[0]?.objectId).toBe("0xpool");
    expect(store.health(["bounty_board.SingleBountyCreatedEvent"]).totals.lifecycleEventsProcessed).toBe(1);
    expect(store.health(["bounty_board.SingleBountyCreatedEvent"]).lastLifecycleSyncAt).not.toBeNull();
    expect(store.health(["bounty_board.SingleBountyCreatedEvent"]).ready).toBe(false);

    store.close();
  });

  test("records processed actions idempotently by key", () => {
    const store = new OracleStore(":memory:");
    const action = {
      kind: "settle-single" as const,
      objectId: "0xpool",
      coinType: "0x2::sui::SUI",
      hunterCharacterObjectId: "0xcharacter",
      killmailItemId: 88
    };

    expect(store.hasProcessedAction(buildProcessedActionKey(action))).toBe(false);
    store.recordSuccessfulAction(action, "0xdigest");
    expect(store.hasProcessedAction(buildProcessedActionKey(action))).toBe(true);
    expect(store.health([]).totals.oracleWritesExecuted).toBe(1);

    store.close();
  });

  test("records killmail cursor advancement and processed totals", () => {
    const store = new OracleStore(":memory:");

    store.recordKillmailProcessed("killmail-cursor-1");

    expect(store.getCursor(KILLMAIL_STREAM)).toBe("killmail-cursor-1");
    expect(store.health([KILLMAIL_STREAM]).totals.killmailEventsProcessed).toBe(1);
    expect(store.health([KILLMAIL_STREAM]).lastKillmailSyncAt).not.toBeNull();

    store.close();
  });

  test("replaces active indexes from board calibration", () => {
    const store = new OracleStore(":memory:");
    const event: BountyBoardLifecycleEvent = {
      kind: "SingleBountyCreatedEvent",
      eventType: "0xbounty::bounty_board::SingleBountyCreatedEvent",
      timestamp: "2026-03-21T00:00:00Z",
      digest: "0xdigest",
      bountyId: "0xold-pool",
      boardId: "0xboard",
      targetKey: { itemId: 22, tenant: "UTOPIA" },
      lossFilter: 0,
      coinType: "0x2::sui::SUI",
      expiresAtMs: 123,
      note: "note"
    };

    store.applyLifecycleEvent("bounty_board.SingleBountyCreatedEvent", "cursor-1", event);
    expect(store.snapshot().singles[0]?.objectId).toBe("0xold-pool");

    store.replaceActiveIndexes({
      singles: [
        {
          objectId: "0xsingle-new",
          target: { itemId: 2002, tenant: "utopia" },
          lossFilter: 1,
          coinType: "0x2::sui::SUI",
          expiresAtMs: 999
        }
      ],
      multis: [],
      insurances: []
    });

    expect(store.snapshot().singles).toEqual([
      {
        objectId: "0xsingle-new",
        target: { itemId: 2002, tenant: "utopia" },
        lossFilter: 1,
        coinType: "0x2::sui::SUI",
        expiresAtMs: 999
      }
    ]);
    expect(store.health([]).lastBoardCalibrationAt).not.toBeNull();
    expect(store.health([]).ready).toBe(true);

    store.setLastError("boom");
    expect(store.health([]).ready).toBe(false);

    store.close();
  });

  test("rolls back a sqlite transaction on error", () => {
    const store = new OracleStore(":memory:");

    expect(() =>
      withTransaction(store.db, () => {
        store.db.query("insert into cursors (source, cursor, updated_at) values (?, ?, ?)").run("test", "cursor", "now");
        throw new Error("boom");
      })
    ).toThrow("boom");

    expect(store.getCursor("test")).toBeNull();
    store.close();
  });
});
