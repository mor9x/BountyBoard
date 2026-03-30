import { getBoardObjectState, type SuiReadClient } from "@bounty-board/frontier-client";
import type { MatchAction } from "./types";

export function isLikelyOracleActionConflict(message: string) {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("version mismatch") ||
    normalized.includes("object version unavailable") ||
    normalized.includes("current version") ||
    normalized.includes("has been deleted") ||
    normalized.includes("requested consensus object has been deleted") ||
    normalized.includes("could not find the referenced object") ||
    normalized.includes("object not found") ||
    normalized.includes("not-consensus-managed before the transaction executed")
  );
}

export async function isOracleActionResolvedOnChain(client: SuiReadClient, action: MatchAction, nowMs: number) {
  const object = await getBoardObjectState(client, action.objectId);

  if (!object) {
    return true;
  }

  if (object.kind === "single") {
    return object.settled || object.expiresAtMs <= nowMs || object.usedKillmailItemIds.includes(action.killmailItemId);
  }

  if (object.kind === "multi") {
    return (
      object.expiresAtMs <= nowMs ||
      object.recordedKills >= object.targetKills ||
      object.usedKillmailItemIds.includes(action.killmailItemId)
    );
  }

  return object.expiresAtMs <= nowMs;
}
