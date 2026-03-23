import type { MoveStruct, MoveValue, SuiMoveObject } from "@mysten/sui/jsonRpc";
import type { SuiReadClient } from "../rpc/client";
import type {
  ActiveInsuranceBoardRecord,
  ActiveMultiBoardRecord,
  ActiveSingleBoardRecord,
  BoardRegistrySnapshot,
  BoardState
} from "../types/board-state";
import { toTenantItemId } from "./helpers";

export type GetBoardStateArgs = {
  boardId: string;
};

type ReadableMoveObject = {
  objectId: string;
  type: string;
  fields: SuiMoveObject["fields"];
};

function asMoveStructFields(value: MoveStruct): Record<string, MoveValue> | null {
  if (Array.isArray(value)) {
    return null;
  }

  if ("fields" in value && value.fields && typeof value.fields === "object" && !Array.isArray(value.fields)) {
    return value.fields as unknown as Record<string, MoveValue>;
  }

  if (value && typeof value === "object") {
    return value as unknown as Record<string, MoveValue>;
  }

  return null;
}

function asNumber(value: MoveValue, fieldName: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new Error(`Board field ${fieldName} is missing or not numeric`);
}

function asBoolean(value: MoveValue, fieldName: string) {
  if (typeof value === "boolean") {
    return value;
  }

  throw new Error(`Board field ${fieldName} is missing or not boolean`);
}

function asString(value: MoveValue): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const fields = asMoveStructFields(value);
  if (!fields) {
    return null;
  }

  if (typeof fields.bytes === "string") {
    return fields.bytes;
  }

  return null;
}

function asBalanceValue(value: MoveValue, fieldName: string) {
  if (typeof value === "string" || typeof value === "number") {
    return asNumber(value, fieldName);
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Board field ${fieldName} is missing or not a balance`);
  }

  const fields = asMoveStructFields(value as MoveStruct);
  if (!fields) {
    throw new Error(`Board field ${fieldName} is missing or not a balance`);
  }

  return asNumber(fields.value ?? null, `${fieldName}.value`);
}

function asOptionalBalanceValue(value: MoveValue, fieldName: string) {
  if (value == null) {
    return 0;
  }

  try {
    return asBalanceValue(value, fieldName);
  } catch {
    return 0;
  }
}

function asVecMapEntries(value: MoveValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const fields = asMoveStructFields(value as MoveStruct);
  if (!fields) {
    return [];
  }

  const contents = fields.contents;
  if (!Array.isArray(contents)) {
    return [];
  }

  return contents.flatMap((entry) => {
    const entryFields = asMoveStructFields(entry as MoveStruct);
    const key = toTenantItemId(entryFields?.key ?? null);
    const amount = asNumber(entryFields?.value ?? null, "vec_map.value");

    if (!key?.itemId || !key.tenant) {
      return [];
    }

    return [
      {
        key,
        amount
      }
    ];
  });
}

function asIdArray(value: MoveValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry === "string") {
      return [entry];
    }

    if (entry && typeof entry === "object") {
      if ("id" in entry && typeof entry.id === "string") {
        return [entry.id];
      }

      const nested = asMoveStructFields(entry as MoveStruct);
      if (nested && typeof nested.id === "string") {
        return [nested.id];
      }
    }

    return [];
  });
}

function asBoardFields(content: SuiMoveObject["fields"]) {
  const fields = asMoveStructFields(content);
  if (!fields) {
    throw new Error("Board object content does not contain struct fields");
  }

  return fields;
}

function asReadableMoveObject(
  response: Awaited<ReturnType<SuiReadClient["getObject"]>>,
  objectId: string
): ReadableMoveObject | null {
  const content = response.data?.content;
  if (!content || content.dataType !== "moveObject") {
    return null;
  }

  return {
    objectId,
    type: content.type,
    fields: content.fields
  };
}

function parseCoinType(type: string) {
  const start = type.indexOf("<");
  const end = type.lastIndexOf(">");
  if (start === -1 || end === -1 || end <= start + 1) {
    throw new Error(`Object type ${type} does not include a coin type argument`);
  }

  return type.slice(start + 1, end).trim();
}

function parseActiveSingleRecord(object: ReadableMoveObject): ActiveSingleBoardRecord | null {
  if (!object.type.includes("::bounty_board::SingleBountyPool<")) {
    return null;
  }

  const fields = asBoardFields(object.fields);
  const target = toTenantItemId(fields.target_key);
  if (!target?.itemId || !target.tenant) {
    return null;
  }

  return {
    objectId: object.objectId,
    target,
    lossFilter: asNumber(fields.loss_filter ?? null, "loss_filter"),
    coinType: parseCoinType(object.type),
    rewardAmount: asOptionalBalanceValue(fields.reward_balance ?? null, "reward_balance"),
    note: asString(fields.note ?? null),
    expiresAtMs: asNumber(fields.expires_at_ms ?? null, "expires_at_ms"),
    settled: fields.settled == null ? false : asBoolean(fields.settled ?? null, "settled"),
    claimableByHunter: asVecMapEntries(fields.claimable_by_hunter ?? []),
    contributions: asVecMapEntries(fields.contributions ?? [])
  };
}

function parseActiveMultiRecord(object: ReadableMoveObject): ActiveMultiBoardRecord | null {
  if (!object.type.includes("::bounty_board::MultiBountyPool<")) {
    return null;
  }

  const fields = asBoardFields(object.fields);
  const target = toTenantItemId(fields.target_key);
  if (!target?.itemId || !target.tenant) {
    return null;
  }

  return {
    objectId: object.objectId,
    target,
    lossFilter: asNumber(fields.loss_filter ?? null, "loss_filter"),
    coinType: parseCoinType(object.type),
    rewardAmount: asOptionalBalanceValue(fields.reward_balance ?? null, "reward_balance"),
    note: asString(fields.note ?? null),
    expiresAtMs: asNumber(fields.expires_at_ms ?? null, "expires_at_ms"),
    targetKills: asNumber(fields.target_kills ?? null, "target_kills"),
    recordedKills: asNumber(fields.recorded_kills ?? null, "recorded_kills"),
    perKillReward: asNumber(fields.per_kill_reward ?? null, "per_kill_reward"),
    settled: false,
    claimableByHunter: asVecMapEntries(fields.claimable_by_hunter ?? []),
    contributions: asVecMapEntries(fields.contributions ?? [])
  };
}

function parseActiveInsuranceRecord(object: ReadableMoveObject): ActiveInsuranceBoardRecord | null {
  if (!object.type.includes("::bounty_board::InsuranceOrder<")) {
    return null;
  }

  const fields = asBoardFields(object.fields);
  const insured = toTenantItemId(fields.insured_key);
  if (!insured?.itemId || !insured.tenant) {
    return null;
  }

  return {
    objectId: object.objectId,
    insured,
    lossFilter: asNumber(fields.loss_filter ?? null, "loss_filter"),
    coinType: parseCoinType(object.type),
    rewardAmount: asOptionalBalanceValue(fields.reward_balance ?? null, "reward_balance"),
    note: asString(fields.note ?? null),
    expiresAtMs: asNumber(fields.expires_at_ms ?? null, "expires_at_ms"),
    spawnMode: asNumber(fields.spawn_mode ?? null, "spawn_mode"),
    spawnTargetKills: asNumber(fields.spawn_target_kills ?? null, "spawn_target_kills")
  };
}

async function readMoveObject(client: SuiReadClient, objectId: string) {
  const response = await client.getObject({
    id: objectId,
    options: {
      showContent: true,
      showType: true
    }
  });

  return asReadableMoveObject(response, objectId);
}

export async function getBoardState(client: SuiReadClient, args: GetBoardStateArgs): Promise<BoardState> {
  const response = await client.getObject({
    id: args.boardId,
    options: {
      showContent: true
    }
  });

  const content = response.data?.content;
  if (!content || content.dataType !== "moveObject") {
    throw new Error(`Board object ${args.boardId} is not readable as a move object`);
  }

  const fields = asBoardFields(content.fields);

  return {
    objectId: args.boardId,
    schemaVersion: asNumber(fields.schema_version ?? null, "schema_version"),
    minDurationDays: asNumber(fields.min_duration_days ?? null, "min_duration_days"),
    maxDurationDays: asNumber(fields.max_duration_days ?? null, "max_duration_days"),
    maxNoteBytes: asNumber(fields.max_note_bytes ?? null, "max_note_bytes"),
    activeSingleBountyIds: asIdArray(fields.active_single_bounty_ids ?? []),
    activeMultiBountyIds: asIdArray(fields.active_multi_bounty_ids ?? []),
    activeInsuranceOrderIds: asIdArray(fields.active_insurance_order_ids ?? [])
  };
}

export async function getBoardRegistrySnapshot(client: SuiReadClient, args: GetBoardStateArgs): Promise<BoardRegistrySnapshot> {
  const board = await getBoardState(client, args);
  const [singleObjects, multiObjects, insuranceObjects] = await Promise.all([
    Promise.all(board.activeSingleBountyIds.map((objectId) => readMoveObject(client, objectId))),
    Promise.all(board.activeMultiBountyIds.map((objectId) => readMoveObject(client, objectId))),
    Promise.all(board.activeInsuranceOrderIds.map((objectId) => readMoveObject(client, objectId)))
  ]);

  return {
    board,
    singles: singleObjects.flatMap((object) => {
      const record = object ? parseActiveSingleRecord(object) : null;
      return record ? [record] : [];
    }),
    multis: multiObjects.flatMap((object) => {
      const record = object ? parseActiveMultiRecord(object) : null;
      return record ? [record] : [];
    }),
    insurances: insuranceObjects.flatMap((object) => {
      const record = object ? parseActiveInsuranceRecord(object) : null;
      return record ? [record] : [];
    })
  };
}
