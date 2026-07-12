import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface CreateRunWorkspaceInput {
  root: string;
  runId: string;
  targetUrl: string;
}

const RUN_DIRECTORIES = [
  "source",
  "audit",
  "research",
  "strategy",
  "copy",
  join("variants", "a"),
  join("variants", "b"),
  "qa",
  "deploy",
] as const;

export async function createRunWorkspace({
  root,
  runId,
  targetUrl,
}: CreateRunWorkspaceInput): Promise<string> {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(runId)) {
    throw new Error(
      "Run ID must be a single safe path segment using letters, numbers, dots, underscores, or hyphens",
    );
  }
  const workspace = join(root, runId);
  await Promise.all(
    RUN_DIRECTORIES.map((directory) =>
      mkdir(join(workspace, directory), { recursive: true }),
    ),
  );
  await writeFile(
    join(workspace, "manifest.json"),
    JSON.stringify(
      {
        runId,
        targetUrl,
        status: "created",
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );
  return workspace;
}
