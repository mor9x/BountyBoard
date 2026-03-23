import { Transaction } from "@mysten/sui/transactions";
import { utopiaEnvironment } from "../constants";

export const KILLMAIL_LOSS_TYPE = {
  ship: 1,
  structure: 2
} as const;

function requireObjectId(value: string | undefined, label: string) {
  if (!value || !value.trim()) {
    throw new Error(`${label} is missing`);
  }

  return value;
}

export function buildEmitKillmailTx(args: {
  simulationWorldPackageId?: string;
  killmailRegistryId?: string;
  adminAclId?: string;
  reportedByCharacterObjectId: string;
  itemId: number;
  killerId: number;
  victimId: number;
  killTimestamp: number;
  lossType: number;
  solarSystemId: number;
}) {
  const simulationWorldPackageId = requireObjectId(
    args.simulationWorldPackageId ?? utopiaEnvironment.simulationWorldPackageId,
    "Simulation world package ID"
  );
  const killmailRegistryId = requireObjectId(
    args.killmailRegistryId ?? utopiaEnvironment.simulationWorldKillmailRegistryId,
    "Killmail registry ID"
  );
  const adminAclId = requireObjectId(args.adminAclId ?? utopiaEnvironment.simulationWorldAdminAclId, "Admin ACL ID");
  const reportedByCharacterObjectId = requireObjectId(args.reportedByCharacterObjectId, "Reporter character object ID");
  const tx = new Transaction();

  tx.moveCall({
    target: `${simulationWorldPackageId}::killmail::create_killmail`,
    arguments: [
      tx.object(killmailRegistryId),
      tx.object(adminAclId),
      tx.pure.u64(args.itemId),
      tx.pure.u64(args.killerId),
      tx.pure.u64(args.victimId),
      tx.object(reportedByCharacterObjectId),
      tx.pure.u64(args.killTimestamp),
      tx.pure.u8(args.lossType),
      tx.pure.u64(args.solarSystemId)
    ]
  });

  return tx;
}
