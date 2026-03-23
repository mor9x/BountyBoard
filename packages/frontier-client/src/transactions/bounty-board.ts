import type { SuiReadClient } from "../rpc/client";
import { Transaction } from "@mysten/sui/transactions";
import { utopiaEnvironment } from "../constants";

export const LOSS_FILTER = {
  any: 0,
  ship: 1,
  structure: 2
} as const;

export const SPAWN_MODE = {
  single: 1,
  multi: 2
} as const;

type SharedConfig = {
  packageId?: string;
  boardId?: string;
  clockObjectId?: string;
};

type BaseBountyArgs = SharedConfig & {
  owner: string;
  coinType: string;
  amount: number;
  posterCharacterObjectId: string;
  durationDays: number;
  lossFilter: number;
  note: string;
};

type BuildCoinArgs = {
  client: SuiReadClient;
  tx: Transaction;
  owner: string;
  coinType: string;
  amount: number;
};

async function buildRewardCoin({ client, tx, owner, coinType, amount }: BuildCoinArgs) {
  if (coinType === "0x2::sui::SUI") {
    return tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
  }

  const coins = await client.getCoins({
    owner,
    coinType
  });
  const selectedIds: string[] = [];
  let total = 0;

  for (const coin of coins.data) {
    selectedIds.push(coin.coinObjectId);
    total += Number(coin.balance);
    if (total >= amount) {
      break;
    }
  }

  if (total < amount || selectedIds.length === 0) {
    throw new Error(`Wallet does not have enough balance for ${coinType}`);
  }

  const [primaryId, ...mergeIds] = selectedIds;
  const primary = tx.object(primaryId);
  if (mergeIds.length > 0) {
    tx.mergeCoins(
      primary,
      mergeIds.map((coinId) => tx.object(coinId))
    );
  }

  return tx.splitCoins(primary, [tx.pure.u64(amount)]);
}

type MoveCallInput = Extract<Parameters<Transaction["moveCall"]>[0], { target: string }>;

function applyBase(
  target: string,
  typeArguments: string[],
  args: NonNullable<MoveCallInput["arguments"]>
): MoveCallInput {
  return {
    target,
    typeArguments,
    arguments: args
  };
}

function resolveBase(config?: SharedConfig) {
  return {
    packageId: config?.packageId ?? utopiaEnvironment.bountyBoardPackageId,
    boardId: config?.boardId ?? utopiaEnvironment.boardId,
    clockObjectId: config?.clockObjectId ?? utopiaEnvironment.clockObjectId
  };
}

export async function buildCreateSingleBountyTx(
  client: SuiReadClient,
  args: BaseBountyArgs & {
    targetCharacterObjectId: string;
  }
) {
  const tx = new Transaction();
  const config = resolveBase(args);
  const rewardCoin = await buildRewardCoin({
    client,
    tx,
    owner: args.owner,
    coinType: args.coinType,
    amount: args.amount
  });

  tx.moveCall(
    applyBase(
      `${config.packageId}::bounty_board::create_single_bounty`,
      [args.coinType],
      [
        tx.object(config.boardId),
        tx.object(args.posterCharacterObjectId),
        tx.object(args.targetCharacterObjectId),
        rewardCoin,
        tx.pure.u64(args.durationDays),
        tx.pure.u8(args.lossFilter),
        tx.pure.string(args.note),
        tx.object(config.clockObjectId)
      ]
    )
  );

  return tx;
}

export async function buildCreateMultiBountyTx(
  client: SuiReadClient,
  args: BaseBountyArgs & {
    targetCharacterObjectId: string;
    targetKills: number;
  }
) {
  const tx = new Transaction();
  const config = resolveBase(args);
  const rewardCoin = await buildRewardCoin({
    client,
    tx,
    owner: args.owner,
    coinType: args.coinType,
    amount: args.amount
  });

  tx.moveCall(
    applyBase(
      `${config.packageId}::bounty_board::create_multi_bounty`,
      [args.coinType],
      [
        tx.object(config.boardId),
        tx.object(args.posterCharacterObjectId),
        tx.object(args.targetCharacterObjectId),
        rewardCoin,
        tx.pure.u64(args.durationDays),
        tx.pure.u8(args.lossFilter),
        tx.pure.u64(args.targetKills),
        tx.pure.string(args.note),
        tx.object(config.clockObjectId)
      ]
    )
  );

  return tx;
}

export async function buildCreateInsuranceOrderTx(
  client: SuiReadClient,
  args: BaseBountyArgs & {
    spawnMode: number;
    spawnTargetKills: number;
  }
) {
  const tx = new Transaction();
  const config = resolveBase(args);
  const rewardCoin = await buildRewardCoin({
    client,
    tx,
    owner: args.owner,
    coinType: args.coinType,
    amount: args.amount
  });

  tx.moveCall(
    applyBase(
      `${config.packageId}::bounty_board::create_insurance_order`,
      [args.coinType],
      [
        tx.object(config.boardId),
        tx.object(args.posterCharacterObjectId),
        rewardCoin,
        tx.pure.u64(args.durationDays),
        tx.pure.u8(args.lossFilter),
        tx.pure.u8(args.spawnMode),
        tx.pure.u64(args.spawnTargetKills),
        tx.pure.string(args.note),
        tx.object(config.clockObjectId)
      ]
    )
  );

  return tx;
}

export function buildClaimSingleBountyTx(
  args: SharedConfig & {
    coinType: string;
    poolObjectId: string;
    hunterCharacterObjectId: string;
  }
) {
  const tx = new Transaction();
  const config = resolveBase(args);

  tx.moveCall(
    applyBase(
      `${config.packageId}::bounty_board::claim_single_bounty`,
      [args.coinType],
      [tx.object(config.boardId), tx.object(args.poolObjectId), tx.object(args.hunterCharacterObjectId)]
    )
  );

  return tx;
}

export function buildClaimMultiBountyTx(
  args: SharedConfig & {
    coinType: string;
    poolObjectId: string;
    hunterCharacterObjectId: string;
  }
) {
  const tx = new Transaction();
  const config = resolveBase(args);

  tx.moveCall(
    applyBase(
      `${config.packageId}::bounty_board::claim_multi_bounty`,
      [args.coinType],
      [tx.object(config.boardId), tx.object(args.poolObjectId), tx.object(args.hunterCharacterObjectId)]
    )
  );

  return tx;
}

export function buildRefundSingleBountyTx(
  args: SharedConfig & {
    coinType: string;
    poolObjectId: string;
    posterCharacterObjectId: string;
  }
) {
  const tx = new Transaction();
  const config = resolveBase(args);

  tx.moveCall(
    applyBase(
      `${config.packageId}::bounty_board::refund_expired_single_contribution`,
      [args.coinType],
      [
        tx.object(config.boardId),
        tx.object(args.poolObjectId),
        tx.object(args.posterCharacterObjectId),
        tx.object(config.clockObjectId)
      ]
    )
  );

  return tx;
}

export function buildRefundMultiBountyTx(
  args: SharedConfig & {
    coinType: string;
    poolObjectId: string;
    posterCharacterObjectId: string;
  }
) {
  const tx = new Transaction();
  const config = resolveBase(args);

  tx.moveCall(
    applyBase(
      `${config.packageId}::bounty_board::refund_expired_multi_contribution`,
      [args.coinType],
      [
        tx.object(config.boardId),
        tx.object(args.poolObjectId),
        tx.object(args.posterCharacterObjectId),
        tx.object(config.clockObjectId)
      ]
    )
  );

  return tx;
}

export function buildRefundInsuranceTx(
  args: SharedConfig & {
    coinType: string;
    orderObjectId: string;
    insuredCharacterObjectId: string;
  }
) {
  const tx = new Transaction();
  const config = resolveBase(args);

  tx.moveCall(
    applyBase(
      `${config.packageId}::bounty_board::refund_expired_insurance`,
      [args.coinType],
      [
        tx.object(config.boardId),
        tx.object(args.orderObjectId),
        tx.object(args.insuredCharacterObjectId),
        tx.object(config.clockObjectId)
      ]
    )
  );

  return tx;
}
