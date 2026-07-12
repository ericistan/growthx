import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { JsonlTraceRecorder } from "../src/logger.js";

const created: string[] = [];
afterEach(async () => {
  await Promise.all(created.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("JsonlTraceRecorder", () => {
  it("persists one validated trace event per line", async () => {
    const root = await mkdtemp(join(tmpdir(), "agency-log-"));
    created.push(root);
    const path = join(root, "events.jsonl");
    const recorder = new JsonlTraceRecorder(path);

    await recorder.record({
      runId: "run-1",
      agent: "manager",
      phase: "plan",
      status: "success",
      startedAt: 100,
      endedAt: 120,
      latencyMs: 20,
      inputSummary: "Plan specialist work",
      outputPath: "runs/run-1/manifest.json",
    });

    const lines = (await readFile(path, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ agent: "manager", status: "success" });
  });
});
