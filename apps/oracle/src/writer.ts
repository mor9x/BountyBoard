import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SerialTransactionExecutor, Transaction } from "@mysten/sui/transactions";
import type { MatchAction, OracleConfig } from "./types";

type OracleWriteErrorOptions = {
  retryable: boolean;
  cause?: unknown;
};

const SAFE_SKIP_WRITE_ERROR_PATTERNS = [
  "single bounty is already settled",
  "killmail item id was already used for this bounty",
  "multi bounty target kills already reached",
  "insurance order has expired",
  "bounty has expired",
  "requested consensus object has been deleted",
  "object has been deleted",
  "has been deleted",
  "could not find the referenced object",
  "object not found",
  "version mismatch",
  "object version unavailable",
  "current version",
  "not-consensus-managed before the transaction executed"
] as const;

export class OracleWriteError extends Error {
  readonly retryable: boolean;

  constructor(message: string, options: OracleWriteErrorOptions) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "OracleWriteError";
    this.retryable = options.retryable;
  }
}

export function isSafeToSkipOracleWriteFailure(message: string) {
  const normalized = message.trim().toLowerCase();
  return SAFE_SKIP_WRITE_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function keypairFromPrivateKey(privateKey: string) {
  const { scheme, secretKey } = decodeSuiPrivateKey(privateKey);
  if (scheme !== "ED25519") {
    throw new Error("Oracle signer must use an ED25519 private key");
  }

  return Ed25519Keypair.fromSecretKey(secretKey);
}

export class OracleWriter {
  private readonly client: SuiGrpcClient;
  private readonly executor: SerialTransactionExecutor;
  private readonly config: OracleConfig;

  constructor(config: OracleConfig) {
    this.config = config;
    const signer = keypairFromPrivateKey(config.oraclePrivateKey);

    this.client = new SuiGrpcClient({
      network: config.network,
      baseUrl: config.grpcUrl
    });
    this.executor = new SerialTransactionExecutor({
      client: this.client,
      signer
    });
  }

  private buildTransaction(action: MatchAction) {
    const tx = new Transaction();
    const targetBase = `${this.config.bountyBoardPackageId}::bounty_board`;

    if (action.kind === "settle-single") {
      tx.moveCall({
        target: `${targetBase}::settle_single_bounty`,
        typeArguments: [action.coinType],
        arguments: [
          tx.object(this.config.oracleCapId),
          tx.object(action.objectId),
          tx.object(action.hunterCharacterObjectId),
          tx.pure.u64(action.killmailItemId),
          tx.object(this.config.clockObjectId)
        ]
      });
    } else if (action.kind === "record-multi-kill") {
      tx.moveCall({
        target: `${targetBase}::record_multi_kill`,
        typeArguments: [action.coinType],
        arguments: [
          tx.object(this.config.oracleCapId),
          tx.object(action.objectId),
          tx.object(action.hunterCharacterObjectId),
          tx.pure.u64(action.killmailItemId),
          tx.object(this.config.clockObjectId)
        ]
      });
    } else {
      tx.moveCall({
        target: `${targetBase}::trigger_insurance_order`,
        typeArguments: [action.coinType],
        arguments: [
          tx.object(this.config.boardId),
          tx.object(this.config.oracleCapId),
          tx.object(action.objectId),
          tx.object(action.killerCharacterObjectId),
          tx.pure.u64(action.killmailItemId),
          tx.object(this.config.clockObjectId)
        ]
      });
    }

    return tx;
  }

  async execute(action: MatchAction) {
    try {
      const result = await this.executor.executeTransaction(this.buildTransaction(action), {
        effects: true,
        events: true,
        objectChanges: true
      });

      if (result.$kind !== "Transaction") {
        const message = result.FailedTransaction.status.error?.message ?? "Oracle transaction did not execute successfully";
        throw new OracleWriteError(message, { retryable: !isSafeToSkipOracleWriteFailure(message) });
      }

      return result.Transaction.digest;
    } catch (error) {
      if (error instanceof OracleWriteError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new OracleWriteError(message, {
        retryable: !isSafeToSkipOracleWriteFailure(message),
        cause: error
      });
    }
  }
}
