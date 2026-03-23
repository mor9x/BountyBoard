import { bcs } from "@mysten/sui/bcs";
import type { SuiMoveObject } from "@mysten/sui/jsonRpc";
import { deriveObjectID } from "@mysten/sui/utils";
import type { MirrorCharacterLookup } from "../types/character";
import type { SuiReadClient } from "../rpc/client";
import { toNullableNumber, toNullableString } from "./helpers";

type MoveFields = Record<string, unknown>;

function toMoveFields(value: unknown): MoveFields | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    return null;
  }

  if ("fields" in value && value.fields && typeof value.fields === "object" && !Array.isArray(value.fields)) {
    return value.fields as MoveFields;
  }

  return value as MoveFields;
}

function unwrapOption(value: unknown) {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : null;
  }

  const record = value as MoveFields;
  if (Array.isArray(record.vec)) {
    return record.vec.length > 0 ? record.vec[0] : null;
  }

  if ("value" in record && record.value && typeof record.value === "object") {
    return record.value;
  }

  return value;
}

function parseMetadata(value: unknown) {
  const metadata = toMoveFields(unwrapOption(value));
  return {
    name: toNullableString(metadata?.name ?? null),
    description: toNullableString(metadata?.description ?? null),
    url: toNullableString(metadata?.url ?? null)
  };
}

function parseCharacterObject(objectId: string, worldPackageId: string, fields: SuiMoveObject["fields"]): MirrorCharacterLookup | null {
  const parsed = toMoveFields(fields);
  if (!parsed) {
    return null;
  }

  const key = toMoveFields(parsed.key);
  const itemId = toNullableNumber(key?.item_id ?? null);
  const tenant = toNullableString(key?.tenant ?? null);

  if (!itemId || !tenant) {
    return null;
  }

  return {
    exists: true,
    objectId,
    worldPackageId,
    itemId,
    tenant,
    tribeId: toNullableNumber(parsed.tribe_id ?? null),
    characterAddress: toNullableString(parsed.character_address ?? null),
    ownerCapId: toNullableString(parsed.owner_cap_id ?? null),
    metadata: parseMetadata(parsed.metadata ?? null)
  };
}

export function deriveTenantItemIdBytes(itemId: number, tenant: string) {
  return bcs
    .struct("TenantItemId", {
      item_id: bcs.u64(),
      tenant: bcs.string()
    })
    .serialize({
      item_id: String(itemId),
      tenant
    })
    .toBytes();
}

export function deriveCharacterObjectId(worldObjectRegistryId: string, worldPackageId: string, itemId: number, tenant: string) {
  return deriveObjectID(
    worldObjectRegistryId,
    `${worldPackageId}::in_game_id::TenantItemId`,
    deriveTenantItemIdBytes(itemId, tenant)
  );
}

export async function getCharacterByItemId(
  client: SuiReadClient,
  args: {
    worldPackageId: string;
    worldObjectRegistryId: string;
    itemId: number;
    tenant: string;
  }
): Promise<MirrorCharacterLookup | null> {
  const objectId = deriveCharacterObjectId(args.worldObjectRegistryId, args.worldPackageId, args.itemId, args.tenant);
  const response = await client.getObject({
    id: objectId,
    options: {
      showContent: true,
      showType: true
    }
  });

  const content = response.data?.content;
  if (!content || content.dataType !== "moveObject") {
    return null;
  }

  return parseCharacterObject(objectId, args.worldPackageId, content.fields);
}
