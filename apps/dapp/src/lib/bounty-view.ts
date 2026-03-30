import {
  getSupportedTokenByCoinType,
  type ActiveInsuranceBoardRecord,
  type ActiveMultiBoardRecord,
  type ActiveSingleBoardRecord,
  type BoardRegistrySnapshot,
  type MirrorCharacterLookup
} from "@bounty-board/frontier-client";

export type BountyCardModel = {
  id: string;
  kind: "single" | "multi" | "insurance";
  targetLabel: string;
  targetItemId: number | null;
  targetTenant: string | null;
  rewardAmount: number;
  tokenSymbol: string;
  perKillReward: number;
  killCount: number;
  completedKills: number;
  deadline: number;
  status: "active" | "claimable" | "expired" | "refundable";
  note: string | null;
  claimableAmount: number;
  refundableAmount: number;
  coinType: string;
  isFutureKiller: boolean;
};

function amountForKey(
  entries: Array<{ key: { itemId: number | null; tenant: string | null }; amount: number }>,
  selectedCharacter: MirrorCharacterLookup | null
) {
  if (!selectedCharacter) {
    return 0;
  }

  return (
    entries.find(
      ({ key }) => key.itemId === selectedCharacter.itemId && key.tenant === selectedCharacter.tenant
    )?.amount ?? 0
  );
}

function tokenSymbolForCoinType(coinType: string) {
  return getSupportedTokenByCoinType(coinType)?.symbol ?? coinType;
}

function matchesSelectedCharacter(
  key: { itemId: number | null; tenant: string | null },
  selectedCharacter: MirrorCharacterLookup | null
) {
  return Boolean(selectedCharacter && key.itemId === selectedCharacter.itemId && key.tenant === selectedCharacter.tenant);
}

function resolveStatus(deadline: number, claimableAmount: number, refundableAmount: number) {
  if (claimableAmount > 0) return "claimable" as const;
  if (deadline <= Date.now()) return refundableAmount > 0 ? ("refundable" as const) : ("expired" as const);
  return "active" as const;
}

function singleToCard(
  record: ActiveSingleBoardRecord,
  selectedCharacter: MirrorCharacterLookup | null,
  futureKillerBountyIds: ReadonlySet<string>
): BountyCardModel {
  const claimableAmount = amountForKey(record.claimableByHunter, selectedCharacter);
  const refundableAmount = amountForKey(record.contributions, selectedCharacter);
  return {
    id: record.objectId,
    kind: "single",
    targetLabel: String(record.target.itemId ?? "UNKNOWN"),
    targetItemId: record.target.itemId,
    targetTenant: record.target.tenant,
    rewardAmount: record.rewardAmount,
    tokenSymbol: tokenSymbolForCoinType(record.coinType),
    perKillReward: record.rewardAmount,
    killCount: 1,
    completedKills: record.settled ? 1 : 0,
    deadline: record.expiresAtMs,
    status: resolveStatus(record.expiresAtMs, claimableAmount, refundableAmount),
    note: record.note,
    claimableAmount,
    refundableAmount,
    coinType: record.coinType,
    isFutureKiller: futureKillerBountyIds.has(record.objectId)
  };
}

function multiToCard(
  record: ActiveMultiBoardRecord,
  selectedCharacter: MirrorCharacterLookup | null,
  futureKillerBountyIds: ReadonlySet<string>
): BountyCardModel {
  const claimableAmount = amountForKey(record.claimableByHunter, selectedCharacter);
  const refundableAmount = amountForKey(record.contributions, selectedCharacter);
  return {
    id: record.objectId,
    kind: "multi",
    targetLabel: String(record.target.itemId ?? "UNKNOWN"),
    targetItemId: record.target.itemId,
    targetTenant: record.target.tenant,
    rewardAmount: record.rewardAmount,
    tokenSymbol: tokenSymbolForCoinType(record.coinType),
    perKillReward: record.perKillReward,
    killCount: record.targetKills,
    completedKills: record.recordedKills,
    deadline: record.expiresAtMs,
    status: resolveStatus(record.expiresAtMs, claimableAmount, refundableAmount),
    note: record.note,
    claimableAmount,
    refundableAmount,
    coinType: record.coinType,
    isFutureKiller: futureKillerBountyIds.has(record.objectId)
  };
}

function insuranceToCard(
  record: ActiveInsuranceBoardRecord,
  selectedCharacter: MirrorCharacterLookup | null
): BountyCardModel | null {
  if (!matchesSelectedCharacter(record.insured, selectedCharacter)) {
    return null;
  }

  const refundableAmount = record.expiresAtMs <= Date.now() ? record.rewardAmount : 0;

  return {
    id: record.objectId,
    kind: "insurance",
    targetLabel: String(record.insured.itemId ?? "UNKNOWN"),
    targetItemId: record.insured.itemId,
    targetTenant: record.insured.tenant,
    rewardAmount: record.rewardAmount,
    tokenSymbol: tokenSymbolForCoinType(record.coinType),
    perKillReward: record.spawnTargetKills > 0 ? Math.floor(record.rewardAmount / record.spawnTargetKills) : record.rewardAmount,
    killCount: record.spawnTargetKills > 0 ? record.spawnTargetKills : 1,
    completedKills: 0,
    deadline: record.expiresAtMs,
    status: resolveStatus(record.expiresAtMs, 0, refundableAmount),
    note: record.note,
    claimableAmount: 0,
    refundableAmount,
    coinType: record.coinType,
    isFutureKiller: true
  };
}

export function snapshotToCards(
  snapshot: BoardRegistrySnapshot,
  selectedCharacter: MirrorCharacterLookup | null,
  futureKillerBountyIds: ReadonlySet<string>
) {
  return [
    ...snapshot.singles.map((record) => singleToCard(record, selectedCharacter, futureKillerBountyIds)),
    ...snapshot.multis.map((record) => multiToCard(record, selectedCharacter, futureKillerBountyIds)),
    ...snapshot.insurances.flatMap((record) => {
      const card = insuranceToCard(record, selectedCharacter);
      return card ? [card] : [];
    })
  ];
}
