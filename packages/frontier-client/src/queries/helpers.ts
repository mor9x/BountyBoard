import type { TenantItemIdJson } from "../types/killmail";

export type GraphQLEventNode = {
  timestamp?: string | null;
  contents?: {
    json?: Record<string, unknown> | null;
  } | null;
  transaction?: {
    digest?: string | null;
  } | null;
};

export type GraphQLEventEdge = {
  cursor?: string | null;
  node?: GraphQLEventNode | null;
};

export function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function toMoveEnumVariant(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const variant = record["@variant"];
  return typeof variant === "string" ? variant : null;
}

export function toTenantItemId(value: unknown): TenantItemIdJson | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const nested =
    "fields" in record && record.fields && typeof record.fields === "object" && !Array.isArray(record.fields)
      ? (record.fields as Record<string, unknown>)
      : record;

  return {
    itemId: toNullableNumber(nested.item_id),
    tenant: toNullableString(nested.tenant)
  };
}
