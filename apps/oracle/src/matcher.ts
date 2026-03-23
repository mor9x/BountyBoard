import type { KillmailEvent } from "@bounty-board/frontier-client";
import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";
import { LOSS_ANY, LOSS_SHIP, LOSS_STRUCTURE, MODE_MULTI } from "./constants";
import type { ActiveIndexSnapshot, MatchAction, OracleConfig } from "./types";

const tenantItemIdBcs = bcs.struct("TenantItemId", {
  item_id: bcs.u64(),
  tenant: bcs.string()
});

function matchesLossFilter(lossFilter: number, lossType: string | null) {
  if (lossFilter === LOSS_ANY) {
    return true;
  }

  if (lossFilter === LOSS_SHIP) {
    return lossType === "SHIP";
  }

  if (lossFilter === LOSS_STRUCTURE) {
    return lossType === "STRUCTURE";
  }

  return false;
}

function deriveCharacterObjectId(config: OracleConfig, itemId: number, tenant: string) {
  const keyBytes = tenantItemIdBcs.serialize({
    item_id: String(itemId),
    tenant
  }).toBytes();

  return deriveObjectID(
    config.worldObjectRegistryId,
    `${config.worldPackageId}::in_game_id::TenantItemId`,
    keyBytes
  );
}

export function matchKillmailEvent(
  config: OracleConfig,
  snapshot: ActiveIndexSnapshot,
  event: KillmailEvent,
  nowMs = Date.now()
): MatchAction[] {
  if (
    event.killmailItemId == null ||
    event.killerId?.itemId == null ||
    event.killerId.tenant == null ||
    event.victimId?.itemId == null ||
    event.victimId.tenant == null
  ) {
    return [];
  }

  const hunterCharacterObjectId = deriveCharacterObjectId(config, event.killerId.itemId, event.killerId.tenant);

  const singles = snapshot.singles
    .filter(
      (record) =>
        record.expiresAtMs > nowMs &&
        record.target.itemId === event.victimId?.itemId &&
        record.target.tenant === event.victimId?.tenant &&
        matchesLossFilter(record.lossFilter, event.lossType)
    )
    .map<MatchAction>((record) => ({
      kind: "settle-single",
      objectId: record.objectId,
      coinType: record.coinType,
      hunterCharacterObjectId,
      killmailItemId: event.killmailItemId!
    }));

  const multis = snapshot.multis
    .filter(
      (record) =>
        record.expiresAtMs > nowMs &&
        record.target.itemId === event.victimId?.itemId &&
        record.target.tenant === event.victimId?.tenant &&
        matchesLossFilter(record.lossFilter, event.lossType)
    )
    .map<MatchAction>((record) => ({
      kind: "record-multi-kill",
      objectId: record.objectId,
      coinType: record.coinType,
      hunterCharacterObjectId,
      killmailItemId: event.killmailItemId!,
      nextRecordedKills: record.recordedKills + 1,
      targetKills: record.targetKills
    }));

  const insurances = snapshot.insurances
    .filter(
      (record) =>
        record.expiresAtMs > nowMs &&
        record.insured.itemId === event.victimId?.itemId &&
        record.insured.tenant === event.victimId?.tenant &&
        matchesLossFilter(record.lossFilter, event.lossType)
    )
    .map<MatchAction>((record) => ({
      kind: "trigger-insurance",
      objectId: record.objectId,
      coinType: record.coinType,
      killerCharacterObjectId: hunterCharacterObjectId,
      killmailItemId: event.killmailItemId!
    }));

  return [...singles, ...multis, ...insurances];
}

export function insuranceSpawnsMulti(spawnMode: number) {
  return spawnMode === MODE_MULTI;
}
