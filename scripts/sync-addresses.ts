import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type DeploymentArtifact = {
  packageId?: string;
};

const artifactPath = resolve("contracts/bounty_board/.deployment/utopia-testnet.json");
const outputPath = resolve("packages/frontier-client/src/constants/generated.ts");

async function main() {
  const raw = await readFile(artifactPath, "utf8");
  const artifact = JSON.parse(raw) as DeploymentArtifact;

  const packageId = artifact.packageId ?? "0x0";

  const file = `export const generatedIds = {
  bountyBoardPackageId: "${packageId}"
} as const;
`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, file, "utf8");

  console.log(`Updated ${outputPath}`);
}

main().catch((error) => {
  console.error("Failed to sync addresses:", error);
  process.exit(1);
});
