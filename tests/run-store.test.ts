import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FileRunStore } from "../src/server/run-store.js";

const created: string[] = [];
afterEach(async () => {
  await Promise.all(created.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("FileRunStore", () => {
  it("persists run state across store instances", async () => {
    const root = await mkdtemp(join(tmpdir(), "repager-store-"));
    created.push(root);
    const first = new FileRunStore(root);

    await first.create({ runId: "run-1", targetUrl: "https://example.com" });
    await first.update("run-1", { status: "running", hermesRunId: "hermes-1" });

    const second = new FileRunStore(root);
    await expect(second.get("run-1")).resolves.toMatchObject({
      runId: "run-1",
      targetUrl: "https://example.com",
      status: "running",
      hermesRunId: "hermes-1",
    });
  });
});
