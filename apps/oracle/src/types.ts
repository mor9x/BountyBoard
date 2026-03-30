import type { BountyBoardEventName, BountyBoardLifecycleEvent, TenantItemIdJson } from "@bounty-board/frontier-client";

export type OracleConfig = {
  graphQLEndpoint: string;
  grpcUrl: string;
  worldPackageId: string;
  worldObjectRegistryId: string;
  bountyBoardPackageId: string;
  boardId: string;
  oracleCapId: string;
  oraclePrivateKey: string;
  dbPath: string;
  pollIntervalMs: number;
  graphQLPageSize: number;
  healthPort: number;
  clockObjectId: string;
  network: "testnet";
};

export type ActiveSingleBountyRecord = {
  objectId: string;
  target: TenantItemIdJson;
  lossFilter: number;
  coinType: string;
  expiresAtMs: number;
};

export type ActiveMultiBountyRecord = {
  objectId: string;
  target: TenantItemIdJson;
  lossFilter: number;
  coinType: string;
  expiresAtMs: number;
  targetKills: number;
  recordedKills: number;
  perKillReward: number;
};

export type ActiveInsuranceRecord = {
  objectId: string;
  insured: TenantItemIdJson;
  lossFilter: number;
  coinType: string;
  expiresAtMs: number;
  spawnMode: number;
  spawnTargetKills: number;
};

export type ActiveIndexSnapshot = {
  singles: ActiveSingleBountyRecord[];
  multis: ActiveMultiBountyRecord[];
  insurances: ActiveInsuranceRecord[];
};

export type MatchAction =
  | {
      kind: "settle-single";
      objectId: string;
      coinType: string;
      hunterCharacterObjectId: string;
      killmailItemId: number;
    }
  | {
      kind: "record-multi-kill";
      objectId: string;
      coinType: string;
      hunterCharacterObjectId: string;
      killmailItemId: number;
      nextRecordedKills: number;
      targetKills: number;
    }
  | {
      kind: "trigger-insurance";
      objectId: string;
      coinType: string;
      killerCharacterObjectId: string;
      killmailItemId: number;
    };

export type ServiceHealth = {
  alive: true;
  ready: boolean;
  cursors: Record<string, string | null>;
  active: {
    singles: number;
    multis: number;
    insurances: number;
  };
  totals: {
    lifecycleEventsProcessed: number;
    killmailEventsProcessed: number;
    oracleWritesExecuted: number;
  };
  lastSuccessfulTxDigest: string | null;
  lastSuccessfulTxAt: string | null;
  lastLifecycleSyncAt: string | null;
  lastKillmailSyncAt: string | null;
  lastBoardCalibrationAt: string | null;
  lastError: string | null;
};

export type LifecycleStream = {
  streamKey: string;
  eventName: BountyBoardEventName;
};

export type LifecycleEdge = {
  cursor: string;
  event: BountyBoardLifecycleEvent;
};
