import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type DeploymentArtifact = {
  packageId: string;
  boardId: string;
  oracleCapId: string;
  upgradeCapId: string;
  transactionDigest: string;
  checkpoint: string;
};

type PublishObjectChange = {
  type?: string;
  packageId?: string;
  objectId?: string;
  objectType?: string;
};

type PublishResult = {
  digest?: string;
  checkpoint?: string | number;
  objectChanges?: PublishObjectChange[];
};

export const deploymentArtifactPath = resolve("contracts/bounty_board/.deployment/utopia-testnet.json");
export const generatedDeploymentPath = resolve("packages/frontier-client/src/constants/generated.ts");

function requireString(value: unknown, label: string) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${label}`);
  }

  return value;
}

function formatGeneratedDeployment(artifact: DeploymentArtifact) {
  return `export const generatedDeployment = {
  packageId: "${artifact.packageId}",
  boardId: "${artifact.boardId}",
  oracleCapId: "${artifact.oracleCapId}",
  upgradeCapId: "${artifact.upgradeCapId}",
  transactionDigest: "${artifact.transactionDigest}",
  checkpoint: "${artifact.checkpoint}"
} as const;
`;
}

function findObjectId(changes: PublishObjectChange[], predicate: (change: PublishObjectChange) => boolean, label: string) {
  const match = changes.find(predicate);
  return requireString(match?.objectId, label);
}

export async function readDeploymentArtifact() {
  const raw = await readFile(deploymentArtifactPath, "utf8");
  return JSON.parse(raw) as DeploymentArtifact;
}

export async function writeDeploymentArtifact(artifact: DeploymentArtifact) {
  await mkdir(dirname(deploymentArtifactPath), { recursive: true });
  await writeFile(deploymentArtifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
}

export async function syncGeneratedDeployment(artifact: DeploymentArtifact) {
  await mkdir(dirname(generatedDeploymentPath), { recursive: true });
  await writeFile(generatedDeploymentPath, formatGeneratedDeployment(artifact), "utf8");
}

export async function syncDeploymentConfig() {
  const artifact = await readDeploymentArtifact();
  await syncGeneratedDeployment(artifact);
  return artifact;
}

export function extractDeploymentArtifactFromPublishResult(result: PublishResult): DeploymentArtifact {
  const changes = Array.isArray(result.objectChanges) ? result.objectChanges : [];
  const packageId = requireString(
    changes.find((change) => change.type === "published")?.packageId,
    "published package id"
  );
  const boardId = findObjectId(
    changes,
    (change) => change.objectType === `${packageId}::bounty_board::Board`,
    "Board object id"
  );
  const oracleCapId = findObjectId(
    changes,
    (change) => change.objectType === `${packageId}::bounty_board::OracleCap`,
    "OracleCap object id"
  );
  const upgradeCapId = findObjectId(
    changes,
    (change) => change.objectType === "0x2::package::UpgradeCap",
    "UpgradeCap object id"
  );

  return {
    packageId,
    boardId,
    oracleCapId,
    upgradeCapId,
    transactionDigest: requireString(result.digest, "transaction digest"),
    checkpoint: String(result.checkpoint ?? "")
  };
}
