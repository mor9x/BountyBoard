import type { BountyBoardLifecycleEvent } from "@bounty-board/frontier-client";
import { Database } from "bun:sqlite";
import type { ActiveIndexSnapshot, ActiveInsuranceRecord, ActiveMultiBountyRecord, ActiveSingleBountyRecord, MatchAction, ServiceHealth } from "../types";
import { KILLMAIL_STREAM } from "../constants";
import { openSqliteDatabase, withTransaction } from "./sqlite";

type CursorRow = {
  cursor: string | null;
};

type CountRow = {
  count: number;
};

type ValueRow = {
  value: string | null;
};

type SingleRow = {
  object_id: string;
  target_item_id: number;
  target_tenant: string;
  loss_filter: number;
  coin_type: string;
  expires_at_ms: number;
};

type MultiRow = SingleRow & {
  target_kills: number;
  recorded_kills: number;
  per_kill_reward: number;
};

type InsuranceRow = {
  object_id: string;
  insured_item_id: number;
  insured_tenant: string;
  loss_filter: number;
  coin_type: string;
  expires_at_ms: number;
  spawn_mode: number;
  spawn_target_kills: number;
};

function nowIso() {
  return new Date().toISOString();
}

function coerceCount(value: string | null) {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildProcessedActionKey(action: MatchAction) {
  return `${action.kind}:${action.objectId}:${action.killmailItemId}`;
}

export class OracleStore {
  readonly db: Database;

  constructor(path: string) {
    this.db = openSqliteDatabase(path);
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      create table if not exists cursors (
        source text primary key,
        cursor text,
        updated_at text not null
      );

      create table if not exists active_single_bounties (
        object_id text primary key,
        target_item_id integer not null,
        target_tenant text not null,
        loss_filter integer not null,
        coin_type text not null,
        expires_at_ms integer not null,
        updated_at text not null
      );

      create table if not exists active_multi_bounties (
        object_id text primary key,
        target_item_id integer not null,
        target_tenant text not null,
        loss_filter integer not null,
        coin_type text not null,
        expires_at_ms integer not null,
        target_kills integer not null,
        recorded_kills integer not null,
        per_kill_reward integer not null,
        updated_at text not null
      );

      create table if not exists active_insurance_orders (
        object_id text primary key,
        insured_item_id integer not null,
        insured_tenant text not null,
        loss_filter integer not null,
        coin_type text not null,
        expires_at_ms integer not null,
        spawn_mode integer not null,
        spawn_target_kills integer not null,
        updated_at text not null
      );

      create table if not exists processed_actions (
        unique_key text primary key,
        action_kind text not null,
        object_id text not null,
        killmail_item_id integer not null,
        tx_digest text not null,
        created_at text not null
      );

      create table if not exists service_state (
        key text primary key,
        value text,
        updated_at text not null
      );
    `);
  }

  getCursor(source: string) {
    return this.db.query<CursorRow, [string]>("select cursor from cursors where source = ?").get(source)?.cursor ?? null;
  }

  advanceCursor(source: string, cursor: string) {
    withTransaction(this.db, () => {
      this.db
        .query("insert into cursors (source, cursor, updated_at) values (?, ?, ?) on conflict(source) do update set cursor = excluded.cursor, updated_at = excluded.updated_at")
        .run(source, cursor, nowIso());
    });
  }

  recordKillmailProcessed(cursor: string) {
    withTransaction(this.db, () => {
      const updatedAt = nowIso();
      this.db
        .query("insert into cursors (source, cursor, updated_at) values (?, ?, ?) on conflict(source) do update set cursor = excluded.cursor, updated_at = excluded.updated_at")
        .run(KILLMAIL_STREAM, cursor, updatedAt);
      this.db
        .query("insert into service_state (key, value, updated_at) values ('total_killmail_events_processed', '1', ?) on conflict(key) do update set value = cast(coalesce(service_state.value, '0') as integer) + 1, updated_at = excluded.updated_at")
        .run(updatedAt);
      this.db
        .query("insert into service_state (key, value, updated_at) values ('last_killmail_sync_at', ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
        .run(updatedAt, updatedAt);
    });
  }

  setLastError(message: string | null) {
    withTransaction(this.db, () => {
      this.db
        .query("insert into service_state (key, value, updated_at) values ('last_error', ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
        .run(message, nowIso());
    });
  }

  clearLastError() {
    this.setLastError(null);
  }

  hasProcessedAction(uniqueKey: string) {
    return !!this.db.query("select 1 from processed_actions where unique_key = ?").get(uniqueKey);
  }

  applyLifecycleEvent(streamKey: string, cursor: string, event: BountyBoardLifecycleEvent) {
    withTransaction(this.db, () => {
      const updatedAt = nowIso();

      switch (event.kind) {
        case "SingleBountyCreatedEvent":
          if (
            event.bountyId &&
            event.targetKey?.itemId != null &&
            event.targetKey.tenant != null &&
            event.lossFilter !== null &&
            event.coinType &&
            event.expiresAtMs !== null
          ) {
            this.db
              .query(
                "insert into active_single_bounties (object_id, target_item_id, target_tenant, loss_filter, coin_type, expires_at_ms, updated_at) values (?, ?, ?, ?, ?, ?, ?) on conflict(object_id) do update set target_item_id = excluded.target_item_id, target_tenant = excluded.target_tenant, loss_filter = excluded.loss_filter, coin_type = excluded.coin_type, expires_at_ms = excluded.expires_at_ms, updated_at = excluded.updated_at"
              )
              .run(
                event.bountyId,
                event.targetKey.itemId,
                event.targetKey.tenant,
                event.lossFilter,
                event.coinType,
                event.expiresAtMs,
                updatedAt
              );
          }
          break;
        case "SingleBountyFundedEvent":
          if (event.bountyId && event.expiresAtMs !== null) {
            this.db
              .query("update active_single_bounties set expires_at_ms = ?, updated_at = ? where object_id = ?")
              .run(event.expiresAtMs, updatedAt, event.bountyId);
          }
          break;
        case "SingleBountySettledEvent":
        case "SingleBountyClosedEvent":
          if (event.bountyId) {
            this.db.query("delete from active_single_bounties where object_id = ?").run(event.bountyId);
          }
          break;
        case "MultiBountyCreatedEvent":
          if (
            event.bountyId &&
            event.targetKey?.itemId != null &&
            event.targetKey.tenant != null &&
            event.lossFilter !== null &&
            event.coinType &&
            event.expiresAtMs !== null &&
            event.targetKills !== null &&
            event.perKillReward !== null
          ) {
            this.db
              .query(
                "insert into active_multi_bounties (object_id, target_item_id, target_tenant, loss_filter, coin_type, expires_at_ms, target_kills, recorded_kills, per_kill_reward, updated_at) values (?, ?, ?, ?, ?, ?, ?, 0, ?, ?) on conflict(object_id) do update set target_item_id = excluded.target_item_id, target_tenant = excluded.target_tenant, loss_filter = excluded.loss_filter, coin_type = excluded.coin_type, expires_at_ms = excluded.expires_at_ms, target_kills = excluded.target_kills, per_kill_reward = excluded.per_kill_reward, updated_at = excluded.updated_at"
              )
              .run(
                event.bountyId,
                event.targetKey.itemId,
                event.targetKey.tenant,
                event.lossFilter,
                event.coinType,
                event.expiresAtMs,
                event.targetKills,
                event.perKillReward,
                updatedAt
              );
          }
          break;
        case "MultiBountyFundedEvent":
          if (event.bountyId && event.expiresAtMs !== null && event.perKillReward !== null) {
            this.db
              .query("update active_multi_bounties set expires_at_ms = ?, per_kill_reward = ?, updated_at = ? where object_id = ?")
              .run(event.expiresAtMs, event.perKillReward, updatedAt, event.bountyId);
          }
          break;
        case "MultiBountyKillRecordedEvent":
          if (event.bountyId && event.recordedKills !== null) {
            const current = this.db
              .query<{ target_kills: number }, [string]>("select target_kills from active_multi_bounties where object_id = ?")
              .get(event.bountyId);
            if (current && event.recordedKills < current.target_kills) {
              this.db
                .query("update active_multi_bounties set recorded_kills = ?, updated_at = ? where object_id = ?")
                .run(event.recordedKills, updatedAt, event.bountyId);
            } else if (event.bountyId) {
              this.db.query("delete from active_multi_bounties where object_id = ?").run(event.bountyId);
            }
          }
          break;
        case "MultiBountyClosedEvent":
          if (event.bountyId) {
            this.db.query("delete from active_multi_bounties where object_id = ?").run(event.bountyId);
          }
          break;
        case "InsuranceCreatedEvent":
          if (
            event.orderId &&
            event.insuredKey?.itemId != null &&
            event.insuredKey.tenant != null &&
            event.lossFilter !== null &&
            event.coinType &&
            event.expiresAtMs !== null &&
            event.spawnMode !== null &&
            event.spawnTargetKills !== null
          ) {
            this.db
              .query(
                "insert into active_insurance_orders (object_id, insured_item_id, insured_tenant, loss_filter, coin_type, expires_at_ms, spawn_mode, spawn_target_kills, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?) on conflict(object_id) do update set insured_item_id = excluded.insured_item_id, insured_tenant = excluded.insured_tenant, loss_filter = excluded.loss_filter, coin_type = excluded.coin_type, expires_at_ms = excluded.expires_at_ms, spawn_mode = excluded.spawn_mode, spawn_target_kills = excluded.spawn_target_kills, updated_at = excluded.updated_at"
              )
              .run(
                event.orderId,
                event.insuredKey.itemId,
                event.insuredKey.tenant,
                event.lossFilter,
                event.coinType,
                event.expiresAtMs,
                event.spawnMode,
                event.spawnTargetKills,
                updatedAt
              );
          }
          break;
        case "InsuranceFundedEvent":
          if (event.orderId && event.expiresAtMs !== null) {
            this.db
              .query("update active_insurance_orders set expires_at_ms = ?, updated_at = ? where object_id = ?")
              .run(event.expiresAtMs, updatedAt, event.orderId);
          }
          break;
        case "InsuranceTriggeredEvent":
        case "InsuranceClosedEvent":
          if (event.orderId) {
            this.db.query("delete from active_insurance_orders where object_id = ?").run(event.orderId);
          }
          break;
      }

      this.db
        .query("insert into cursors (source, cursor, updated_at) values (?, ?, ?) on conflict(source) do update set cursor = excluded.cursor, updated_at = excluded.updated_at")
        .run(streamKey, cursor, updatedAt);
      this.db
        .query("insert into service_state (key, value, updated_at) values ('total_lifecycle_events_processed', '1', ?) on conflict(key) do update set value = cast(coalesce(service_state.value, '0') as integer) + 1, updated_at = excluded.updated_at")
        .run(updatedAt);
      this.db
        .query("insert into service_state (key, value, updated_at) values ('last_lifecycle_sync_at', ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
        .run(updatedAt, updatedAt);
    });
  }

  recordSuccessfulAction(action: MatchAction, txDigest: string) {
    withTransaction(this.db, () => {
      const updatedAt = nowIso();
      this.db
        .query(
          "insert into processed_actions (unique_key, action_kind, object_id, killmail_item_id, tx_digest, created_at) values (?, ?, ?, ?, ?, ?)"
        )
        .run(buildProcessedActionKey(action), action.kind, action.objectId, action.killmailItemId, txDigest, updatedAt);

      if (action.kind === "settle-single") {
        this.db.query("delete from active_single_bounties where object_id = ?").run(action.objectId);
      } else if (action.kind === "record-multi-kill") {
        if (action.nextRecordedKills >= action.targetKills) {
          this.db.query("delete from active_multi_bounties where object_id = ?").run(action.objectId);
        } else {
          this.db
            .query("update active_multi_bounties set recorded_kills = ?, updated_at = ? where object_id = ?")
            .run(action.nextRecordedKills, updatedAt, action.objectId);
        }
      } else {
        this.db.query("delete from active_insurance_orders where object_id = ?").run(action.objectId);
      }

      this.db
        .query("insert into service_state (key, value, updated_at) values ('last_successful_tx_digest', ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
        .run(txDigest, updatedAt);
      this.db
        .query("insert into service_state (key, value, updated_at) values ('total_oracle_writes_executed', '1', ?) on conflict(key) do update set value = cast(coalesce(service_state.value, '0') as integer) + 1, updated_at = excluded.updated_at")
        .run(updatedAt);
      this.db
        .query("insert into service_state (key, value, updated_at) values ('last_successful_tx_at', ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
        .run(updatedAt, updatedAt);
      this.db
        .query("insert into service_state (key, value, updated_at) values ('last_error', NULL, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
        .run(updatedAt);
    });
  }

  snapshot(): ActiveIndexSnapshot {
    const singles = this.db
      .query<SingleRow, []>("select object_id, target_item_id, target_tenant, loss_filter, coin_type, expires_at_ms from active_single_bounties")
      .all()
      .map<ActiveSingleBountyRecord>((row: SingleRow) => ({
        objectId: row.object_id,
        target: {
          itemId: row.target_item_id,
          tenant: row.target_tenant
        },
        lossFilter: row.loss_filter,
        coinType: row.coin_type,
        expiresAtMs: row.expires_at_ms
      }));

    const multis = this.db
      .query<MultiRow, []>(
        "select object_id, target_item_id, target_tenant, loss_filter, coin_type, expires_at_ms, target_kills, recorded_kills, per_kill_reward from active_multi_bounties"
      )
      .all()
      .map<ActiveMultiBountyRecord>((row: MultiRow) => ({
        objectId: row.object_id,
        target: {
          itemId: row.target_item_id,
          tenant: row.target_tenant
        },
        lossFilter: row.loss_filter,
        coinType: row.coin_type,
        expiresAtMs: row.expires_at_ms,
        targetKills: row.target_kills,
        recordedKills: row.recorded_kills,
        perKillReward: row.per_kill_reward
      }));

    const insurances = this.db
      .query<InsuranceRow, []>(
        "select object_id, insured_item_id, insured_tenant, loss_filter, coin_type, expires_at_ms, spawn_mode, spawn_target_kills from active_insurance_orders"
      )
      .all()
      .map<ActiveInsuranceRecord>((row: InsuranceRow) => ({
        objectId: row.object_id,
        insured: {
          itemId: row.insured_item_id,
          tenant: row.insured_tenant
        },
        lossFilter: row.loss_filter,
        coinType: row.coin_type,
        expiresAtMs: row.expires_at_ms,
        spawnMode: row.spawn_mode,
        spawnTargetKills: row.spawn_target_kills
      }));

    return { singles, multis, insurances };
  }

  replaceActiveIndexes(snapshot: ActiveIndexSnapshot) {
    withTransaction(this.db, () => {
      const updatedAt = nowIso();

      this.db.query("delete from active_single_bounties").run();
      this.db.query("delete from active_multi_bounties").run();
      this.db.query("delete from active_insurance_orders").run();

      for (const record of snapshot.singles) {
        this.db
          .query(
            "insert into active_single_bounties (object_id, target_item_id, target_tenant, loss_filter, coin_type, expires_at_ms, updated_at) values (?, ?, ?, ?, ?, ?, ?)"
          )
          .run(
            record.objectId,
            record.target.itemId,
            record.target.tenant,
            record.lossFilter,
            record.coinType,
            record.expiresAtMs,
            updatedAt
          );
      }

      for (const record of snapshot.multis) {
        this.db
          .query(
            "insert into active_multi_bounties (object_id, target_item_id, target_tenant, loss_filter, coin_type, expires_at_ms, target_kills, recorded_kills, per_kill_reward, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .run(
            record.objectId,
            record.target.itemId,
            record.target.tenant,
            record.lossFilter,
            record.coinType,
            record.expiresAtMs,
            record.targetKills,
            record.recordedKills,
            record.perKillReward,
            updatedAt
          );
      }

      for (const record of snapshot.insurances) {
        this.db
          .query(
            "insert into active_insurance_orders (object_id, insured_item_id, insured_tenant, loss_filter, coin_type, expires_at_ms, spawn_mode, spawn_target_kills, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .run(
            record.objectId,
            record.insured.itemId,
            record.insured.tenant,
            record.lossFilter,
            record.coinType,
            record.expiresAtMs,
            record.spawnMode,
            record.spawnTargetKills,
            updatedAt
          );
      }

      this.db
        .query("insert into service_state (key, value, updated_at) values ('last_board_calibration_at', ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
        .run(updatedAt, updatedAt);
    });
  }

  health(streamKeys: string[]): ServiceHealth {
    const cursors = Object.fromEntries(streamKeys.map((key) => [key, this.getCursor(key)]));
    const singleCount = this.db.query<CountRow, []>("select count(*) as count from active_single_bounties").get()?.count ?? 0;
    const multiCount = this.db.query<CountRow, []>("select count(*) as count from active_multi_bounties").get()?.count ?? 0;
    const insuranceCount = this.db.query<CountRow, []>("select count(*) as count from active_insurance_orders").get()?.count ?? 0;

    return {
      alive: true,
      cursors,
      active: {
        singles: singleCount,
        multis: multiCount,
        insurances: insuranceCount
      },
      totals: {
        lifecycleEventsProcessed: coerceCount(
          this.db.query<ValueRow, []>("select value from service_state where key = 'total_lifecycle_events_processed'").get()?.value ?? null
        ),
        killmailEventsProcessed: coerceCount(
          this.db.query<ValueRow, []>("select value from service_state where key = 'total_killmail_events_processed'").get()?.value ?? null
        ),
        oracleWritesExecuted: coerceCount(
          this.db.query<ValueRow, []>("select value from service_state where key = 'total_oracle_writes_executed'").get()?.value ?? null
        )
      },
      lastSuccessfulTxDigest:
        this.db.query<ValueRow, []>("select value from service_state where key = 'last_successful_tx_digest'").get()?.value ?? null,
      lastSuccessfulTxAt:
        this.db.query<ValueRow, []>("select value from service_state where key = 'last_successful_tx_at'").get()?.value ?? null,
      lastLifecycleSyncAt:
        this.db.query<ValueRow, []>("select value from service_state where key = 'last_lifecycle_sync_at'").get()?.value ?? null,
      lastKillmailSyncAt:
        this.db.query<ValueRow, []>("select value from service_state where key = 'last_killmail_sync_at'").get()?.value ?? null,
      lastBoardCalibrationAt:
        this.db.query<ValueRow, []>("select value from service_state where key = 'last_board_calibration_at'").get()?.value ?? null,
      lastError:
        this.db.query<ValueRow, []>("select value from service_state where key = 'last_error'").get()?.value ?? null
    };
  }

  close() {
    this.db.close();
  }
}

export function oracleStreamKeys(extra: string[] = []) {
  return [KILLMAIL_STREAM, ...extra];
}
