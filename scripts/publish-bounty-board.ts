import {
  extractDeploymentArtifactFromPublishResult,
  syncGeneratedDeployment,
  writeDeploymentArtifact
} from "./deployment-config";

function getArg(flag: string, fallback?: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return fallback ?? null;
  }

  return process.argv[index + 1] ?? fallback ?? null;
}

async function readStream(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) {
    return "";
  }

  return await new Response(stream).text();
}

async function main() {
  const moveEnvironment = getArg("--environment", "testnet_utopia")!;
  const gasBudget = getArg("--gas-budget", "300000000")!;
  const command = [
    "sui",
    "client",
    "publish",
    "contracts/bounty_board",
    "-e",
    moveEnvironment,
    "--gas-budget",
    gasBudget,
    "--json"
  ];

  const processHandle = Bun.spawn(command, {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe"
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    readStream(processHandle.stdout),
    readStream(processHandle.stderr),
    processHandle.exited
  ]);

  if (exitCode !== 0) {
    throw new Error(stderr || stdout || `Publish failed with exit code ${exitCode}`);
  }

  const artifact = extractDeploymentArtifactFromPublishResult(JSON.parse(stdout) as Record<string, unknown>);
  await writeDeploymentArtifact(artifact);
  await syncGeneratedDeployment(artifact);

  console.log(JSON.stringify(artifact, null, 2));
}

main().catch((error) => {
  console.error("Failed to publish bounty board:", error);
  process.exit(1);
});
