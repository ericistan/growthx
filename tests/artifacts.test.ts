import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createRunWorkspace } from "../src/artifacts.js";

const created: string[] = [];
afterEach(async () => {
  await Promise.all(created.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("createRunWorkspace", () => {
  it("rejects run IDs containing path separators", async () => {
    const root = await mkdtemp(join(tmpdir(), "landing-agency-"));
    created.push(root);

    await expect(
      createRunWorkspace({
        root,
        runId: "nested/run",
        targetUrl: "https://example.com",
      }),
    ).rejects.toThrow(/run id/i);
  });

  it("creates the complete artifact tree and manifest", async () => {
    const root = await mkdtemp(join(tmpdir(), "landing-agency-"));
    created.push(root);

    const workspace = await createRunWorkspace({
      root,
      runId: "run-test-1",
      targetUrl: "https://example.com",
    });

    await expect(stat(join(workspace, "source"))).resolves.toBeDefined();
    await expect(stat(join(workspace, "audit"))).resolves.toBeDefined();
    await expect(stat(join(workspace, "research"))).resolves.toBeDefined();
    await expect(stat(join(workspace, "strategy"))).resolves.toBeDefined();
    await expect(stat(join(workspace, "copy"))).resolves.toBeDefined();
    await expect(stat(join(workspace, "variants", "a"))).resolves.toBeDefined();
    await expect(stat(join(workspace, "variants", "b"))).resolves.toBeDefined();
    await expect(stat(join(workspace, "qa"))).resolves.toBeDefined();
    await expect(stat(join(workspace, "deploy"))).resolves.toBeDefined();

    const manifest = JSON.parse(await readFile(join(workspace, "manifest.json"), "utf8"));
    expect(manifest).toMatchObject({
      runId: "run-test-1",
      targetUrl: "https://example.com",
      status: "created",
    });
  });
});
