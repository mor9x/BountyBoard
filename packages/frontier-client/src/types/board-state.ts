import type { TenantItemIdJson } from "./killmail";

export type BoardState = {
  objectId: string;
  schemaVersion: number;
  minDurationDays: number;
  maxDurationDays: number;
  maxNoteBytes: number;
  activeSingleBountyIds: string[];
  activeMultiBountyIds: string[];
  activeInsuranceOrderIds: string[];
};

export type ActiveSingleBoardRecord = {
  objectId: string;
  target: TenantItemIdJson;
  lossFilter: number;
  coinType: string;
  rewardAmount: number;
  note: string | null;
  expiresAtMs: number;
  settled: boolean;
  claimableByHunter: Array<{
    key: TenantItemIdJson;
    amount: number;
  }>;
  contributions: Array<{
    key: TenantItemIdJson;
    amount: number;
  }>;
};

export type ActiveMultiBoardRecord = ActiveSingleBoardRecord & {
  targetKills: number;
  recordedKills: number;
  perKillReward: number;
};

export type ActiveInsuranceBoardRecord = {
  objectId: string;
  insured: TenantItemIdJson;
  lossFilter: number;
  coinType: string;
  rewardAmount: number;
  note: string | null;
  expiresAtMs: number;
  spawnMode: number;
  spawnTargetKills: number;
};

export type BoardRegistrySnapshot = {
  board: BoardState;
  singles: ActiveSingleBoardRecord[];
  multis: ActiveMultiBoardRecord[];
  insurances: ActiveInsuranceBoardRecord[];
};
